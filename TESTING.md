# Testing — HomegrownHaven

This project ships an automated test suite that **verifies the output** of its core
logic and API. Tests are split across the two languages in the stack:

- **Backend** — [`pytest`](https://docs.pytest.org/) covering pure logic *and* the
  live Flask REST API (run against a real, throwaway Postgres database).
- **Frontend** — [`Vitest`](https://vitest.dev/) covering the shared client-side
  validation/formatting helpers.

**Current status: 76 tests, all passing** (60 backend + 16 frontend). See
[Evidence of a passing run](#evidence-of-a-passing-run) at the bottom.

---

## What is tested, and why

### Backend — unit tests (no database)
Pure functions are tested in isolation, so a failure points straight at the logic.

| Area | Function | File | What's verified |
| --- | --- | --- | --- |
| Distance | `calculate_distance()` | `backend/app.py` | Haversine math: zero distance to self, symmetry, a known city-pair distance within tolerance, one-decimal rounding |
| Query cleaning | `_clean_query_args()` | `backend/app.py` | `''` / `'all'` sentinels dropped for numeric params; real values and text params preserved |
| Request validation | Pydantic models + `validate()` | `backend/validation.py` | Rating 1–5, comment length + whitespace-stripping, positive ids, email format, lat/lng & rating ranges, extra-field ignoring, and the `(instance, None)` / `(None, [errors])` contract |

### Backend — API integration tests (real Postgres)
These drive the **actual Flask route handlers** through Flask's test client against a
seeded test database — exercising routing, request validation, auth-header handling,
SQL queries, and JSON response shapes end-to-end:

- **Businesses** — `GET /get_local` & `/search_local`: returns seeded rows, category
  and `min_rating` filters narrow results, supplying `lat`/`lng` adds a `distance`
  field and sorts by proximity, invalid query params return `400`. `GET /categories`.
- **Reviews** — `GET /get_reviews/<id>`; invalid payload → `400`; non-existent business
  → `400`; a valid create returns `201` and the new row; ownership is enforced on
  delete (`403` for a non-owner). Created rows are cleaned up.
- **Auth** — `POST /auth/sync-user` creates a user (`201`) and returns the expected
  shape; malformed email → `400`.
- **Favorites** — full add → check → remove flow for a seeded user; auth required
  (`403` without the `X-Auth0-User-ID` header).
- **Deals** — `GET /deals/active` and `GET /deals/business/<id>` return seeded deals.
- **Error handling** — an unknown route returns a JSON `404`.

### Frontend — unit tests
The shared helpers in `homegrown-haven/src/utils/validators.js`:

- `validateReview()` — rating range, comment required / min / max length, trimming.
- `buildQueryString()` — URL-encoding and skipping of `null` / `undefined` / `''`.
- `csvCell()` — quote escaping and CSV/formula-injection guard (the `= + - @` prefix
  rule) used by the report/CSV export.

### Out of scope (intentionally)
To keep the suite fast and free of external dependencies, these are **not** covered by
automated tests and are validated manually:

- The LiveKit **voice agent** (`backend/voice_chat.py`) and the **MCP tool server**
  (`voice_mcp/main.py`) — these are thin integration layers over external services
  (LiveKit, Deepgram, Groq, ElevenLabs) and an HTTP API; they have no isolatable pure
  logic worth unit-testing.
- **React component rendering** — component behavior is verified manually in the
  running app; only the extracted pure helpers are unit-tested.

---

## How to run

### Backend (`pytest`)
Requires a local Postgres server (the same one used for development). The test suite
creates and tears down its own database — `business_directory_test` — and **never
touches the real `business_directory` data**.

```bash
# from the repo root, with the project's .venv active
pip install -r backend/requirements-dev.txt
python -m pytest backend/tests -v
```

How the test database works (see `backend/tests/conftest.py`):
1. The fixture sets `DB_NAME=business_directory_test` before importing the app — the
   app already reads its DB name from this env var (`backend/app.py:106-112`), so no
   app code changes were needed.
2. It drops/recreates `business_directory_test` and loads `backend/tests/schema.sql`
   (a self-contained schema + deterministic seed) once per session.
3. Tests run against that seeded DB; write tests clean up after themselves.

> Note: the repo's `backend/db/db.sql` is a **commented-out migration history**, not a
> runnable script. `backend/tests/schema.sql` is a clean, runnable rebuild of the same
> schema (verified against the live database structure) plus fixed seed data, so the
> tests are fully reproducible.

### Frontend (`Vitest`)
```bash
cd homegrown-haven
npm install        # installs vitest (added as a devDependency)
npm test           # runs `vitest run`
# npm run test:watch   # optional: re-run on file changes
```

---

## Test layout

```
backend/
├── requirements-dev.txt          # pytest (test-only dependency)
└── tests/
    ├── conftest.py               # test-DB setup + Flask client / db_conn fixtures
    ├── schema.sql                # self-contained schema + deterministic seed
    ├── test_validation.py        # unit: Pydantic models + validate()
    ├── test_app_helpers.py       # unit: calculate_distance, _clean_query_args
    └── test_api.py               # integration: Flask routes vs. real test DB

homegrown-haven/
└── src/utils/
    ├── validators.js             # helpers under test (validateReview, buildQueryString, csvCell)
    └── validators.test.js        # Vitest unit tests
```

---

## Evidence of a passing run

Captured from an actual local run.

**Backend** — `python -m pytest backend/tests -v`

```
============================= test session starts ==============================
platform darwin -- Python 3.13.7, pytest-9.1.1, pluggy-1.6.0
collected 60 items

backend/tests/test_api.py ............................ (20 API tests) ...... PASSED
backend/tests/test_app_helpers.py ......... (7 helper tests) ............... PASSED
backend/tests/test_validation.py ......................................... PASSED

============================== 60 passed in 0.42s ==============================
```

**Frontend** — `npm test`

```
 RUN  v2.1.9  .../homegrown-haven

 ✓ src/utils/validators.test.js (16 tests) 2ms

 Test Files  1 passed (1)
      Tests  16 passed (16)
```
