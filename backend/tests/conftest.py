"""Shared pytest fixtures for the HomegrownHaven backend tests.

Two responsibilities:
  1. Make the backend modules importable (`app`, `validation`) regardless of the
     directory pytest is invoked from. `app.py` uses `from validation import ...`
     (a flat, non-package import), so the backend/ directory must be on sys.path.
  2. Stand up an isolated, reproducible Postgres test database
     (`business_directory_test`) seeded from schema.sql, and hand tests a Flask
     test client wired to it. The real `business_directory` DB is never touched.

The app reads its DB name from the DB_NAME env var (backend/app.py:106-112), so we
point it at the test database simply by setting DB_NAME *before* importing app.
"""

import os
import sys

import psycopg2
import pytest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_SQL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")

TEST_DB_NAME = "business_directory_test"

# 1. Make `app` / `validation` importable, and point the app at the test DB.
#    These must happen before `import app` (CONFIG is read at import time).
sys.path.insert(0, BACKEND_DIR)
os.environ["DB_NAME"] = TEST_DB_NAME

# Connection params for the *maintenance* connection used to create/drop the test
# DB. Mirror the same env vars app.py honors, with the same defaults.
_DB_USER = os.getenv("DB_USER", "akurukunda01")
_DB_HOST = os.getenv("DB_HOST", "localhost")
_DB_PORT = int(os.getenv("DB_PORT", "5432"))


def _admin_connection():
    """Connect to the default 'postgres' database to run CREATE/DROP DATABASE."""
    conn = psycopg2.connect(
        dbname="postgres", user=_DB_USER, host=_DB_HOST, port=_DB_PORT
    )
    conn.autocommit = True  # CREATE/DROP DATABASE can't run inside a transaction
    return conn


@pytest.fixture(scope="session", autouse=True)
def _setup_test_db():
    """(Re)create business_directory_test and load schema.sql once per session."""
    admin = _admin_connection()
    with admin.cursor() as cur:
        # Drop any leftover from a previous run, then create fresh.
        cur.execute(
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
            "WHERE datname = %s AND pid <> pg_backend_pid();",
            (TEST_DB_NAME,),
        )
        cur.execute(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}";')
        cur.execute(f'CREATE DATABASE "{TEST_DB_NAME}";')
    admin.close()

    # Load schema + seed into the fresh test DB.
    db = psycopg2.connect(
        dbname=TEST_DB_NAME, user=_DB_USER, host=_DB_HOST, port=_DB_PORT
    )
    with open(SCHEMA_SQL, "r") as fh:
        sql = fh.read()
    with db.cursor() as cur:
        cur.execute(sql)
    db.commit()
    db.close()

    yield

    # Teardown: drop the test DB so nothing lingers between runs.
    admin = _admin_connection()
    with admin.cursor() as cur:
        cur.execute(
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
            "WHERE datname = %s AND pid <> pg_backend_pid();",
            (TEST_DB_NAME,),
        )
        cur.execute(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}";')
    admin.close()


@pytest.fixture()
def client():
    """A Flask test client wired to the seeded test database."""
    import app as flask_app

    flask_app.app.config["TESTING"] = True
    with flask_app.app.test_client() as test_client:
        yield test_client


@pytest.fixture()
def db_conn():
    """A raw psycopg2 connection to the test DB for direct setup/cleanup."""
    conn = psycopg2.connect(
        dbname=TEST_DB_NAME, user=_DB_USER, host=_DB_HOST, port=_DB_PORT
    )
    try:
        yield conn
    finally:
        conn.close()


# Convenience constants describing the seeded data (see schema.sql), so tests read
# clearly and stay in sync with the seed.
SEED = {
    "user_id": 1,
    "user_auth0_id": "auth0|testuser",
    "other_user_id": 2,
    "other_auth0_id": "auth0|otheruser",
    "business_id": 1,
    "business_category": "Cafe",
    "business_count": 3,
}
