# Testing

This project uses automated tests to verify the ouptu of its core
logic and API. Tests are split across the two languages in the stack:

- **Backend** — [`pytest`](https://docs.pytest.org/) covering pure logic *and* the
  live Flask REST API (run against a real, throwaway Postgres database).
- **Frontend** — [`Vitest`](https://vitest.dev/) covering the shared client-side
  validation/formatting helpers.

**Current status: 76 tests, all passing** (60 backend + 16 frontend).

### Backend: unit tests
Pure functions are tested in isolation, so a failure points straight at the logic.

| Area | Function | File | What's verified |
| --- | --- | --- | --- |
| Distance | `calculate_distance()` | `backend/app.py` | Haversine math: zero distance to self, symmetry, a known city-pair distance within tolerance, one-decimal rounding |
| Query cleaning | `_clean_query_args()` | `backend/app.py` | `''` / `'all'` sentinels dropped for numeric params; real values and text params preserved |
| Request validation | Pydantic models + `validate()` | `backend/validation.py` | Rating 1–5, comment length + whitespace-stripping, positive ids, email format, lat/lng & rating ranges, extra-field ignoring, and the `(instance, None)` / `(None, [errors])` contract |

### Backend: API Integration tests
These drive the actual Flask route handlers through Flask's test client against a
seeded test database: exercising routing, request validation, auth-header handling,
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

### Frontend: unit tests
The shared helpers in `homegrown-haven/src/utils/validators.js`:

- `validateReview()` — rating range, comment required / min / max length, trimming.
- `buildQueryString()` — URL-encoding and skipping of `null` / `undefined` / `''`.
- `csvCell()` — quote escaping and CSV/formula-injection guard (the `= + - @` prefix
  rule) used by the report/CSV export.

### How to run

### Backend (`pytest`)
Requires a local Postgres server. The test suite creates and tears down its own database — `business_directory_test` — and **never touches the real `business_directory` data**.

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


### Frontend (`Vitest`)
```bash
cd homegrown-haven
npm install        # installs vitest (added as a devDependency)
npm test           # runs `vitest run`
# npm run test:watch   # optional: re-run on file changes
```

### Test layout

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
