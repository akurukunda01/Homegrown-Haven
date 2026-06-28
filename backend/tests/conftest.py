import os
import sys

import psycopg2
import pytest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_SQL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")
TEST_DB_NAME = "business_directory_test"

# Must run before importing app: app reads DB_NAME at import, and uses a flat
# `from validation import ...` so backend/ must be on sys.path.
sys.path.insert(0, BACKEND_DIR)
os.environ["DB_NAME"] = TEST_DB_NAME

_DB_USER = os.getenv("DB_USER", "akurukunda01")
_DB_HOST = os.getenv("DB_HOST", "localhost")
_DB_PORT = int(os.getenv("DB_PORT", "5432"))


def _admin_connection():
    conn = psycopg2.connect(dbname="postgres", user=_DB_USER, host=_DB_HOST, port=_DB_PORT)
    conn.autocommit = True  # CREATE/DROP DATABASE can't run inside a transaction
    return conn


def _drop_test_db(cur):
    cur.execute(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
        "WHERE datname = %s AND pid <> pg_backend_pid();",
        (TEST_DB_NAME,),
    )
    cur.execute(f'DROP DATABASE IF EXISTS "{TEST_DB_NAME}";')


@pytest.fixture(scope="session", autouse=True)
def _setup_test_db():
    admin = _admin_connection()
    with admin.cursor() as cur:
        _drop_test_db(cur)
        cur.execute(f'CREATE DATABASE "{TEST_DB_NAME}";')
    admin.close()

    db = psycopg2.connect(dbname=TEST_DB_NAME, user=_DB_USER, host=_DB_HOST, port=_DB_PORT)
    with open(SCHEMA_SQL, "r") as fh:
        sql = fh.read()
    with db.cursor() as cur:
        cur.execute(sql)
    db.commit()
    db.close()

    yield

    admin = _admin_connection()
    with admin.cursor() as cur:
        _drop_test_db(cur)
    admin.close()


@pytest.fixture()
def client():
    import app as flask_app

    flask_app.app.config["TESTING"] = True
    with flask_app.app.test_client() as test_client:
        yield test_client


@pytest.fixture()
def db_conn():
    conn = psycopg2.connect(dbname=TEST_DB_NAME, user=_DB_USER, host=_DB_HOST, port=_DB_PORT)
    try:
        yield conn
    finally:
        conn.close()


# Mirrors the seeded data in schema.sql.
SEED = {
    "user_id": 1,
    "user_auth0_id": "auth0|testuser",
    "other_user_id": 2,
    "other_auth0_id": "auth0|otheruser",
    "business_id": 1,
    "business_category": "Cafe",
    "business_count": 3,
}
