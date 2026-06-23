# Input Validation

The app validates all user input for **shape**
and for **meaning**:

- **Syntactic validation (shape):** Is it the right *type, length, and format*?
  (e.g. "rating must be a whole number 1–5", "email must look like an email",
  "comment must be 10–500 characters").
- **Semantic validation (meaning):** Does it make sense *in context*? (e.g.
  "this business actually exists", "you are allowed to edit *this* review").

Checks happen in two places: the **frontend** stops obvious mistakes early for a
nicer experience, and the **backend** re-checks everything.


## Technical details

### Backend

**Syntactic — Pydantic models (`backend/validation.py`)**
Each kind of request has a model describing its allowed shape. If the data
doesn't fit, it's rejected automatically:

```python
class ReviewCreate(BaseModel):
    business: int = Field(gt=0)
    rating:   int = Field(ge=1, le=5)            # whole number, 1..5
    comment:  str = Field(min_length=10, max_length=500)
```

Other models: `ReviewUpdate`, `FavoriteCreate`, `AuthSyncUser` (regex
email check), and `BusinessQuery` (rating 0–5, latitude −90..90, longitude
−180..180, max_distance ≥ 0). A small `validate()` helper turns any failure into
a clean `{"errors": [...]}` response with status **400**.

**Semantic — checks inside the routes (`backend/app.py`)**
After the shape is valid, the route checks meaning against the database:

```python
# Does the business exist?
cursor.execute('SELECT id FROM businesses WHERE id = %s', (review.business,))
if not cursor.fetchone():
    return jsonify({'errors': ['business: does not exist']}), 400

# Authorization: checks for owner of the review
if existing['user_id'] != current_user_id(cursor):
    return jsonify({'error': 'Not authorized to modify this review'}), 403
```

A catch-all error handler returns clean JSON instead of a crash page if anything
unexpected happens.

### Frontend - `homegrown-haven/src/`
A shared helper file avoids copy-pasting rules:

```js
// utils/validators.js
export function validateReview(review) { /* rating 1-5, comment 10-500 */ }
export function buildQueryString(params) { /* safely URL-encodes input */ }
export const SEARCH_MAX = 200;
```

- `business-detail.jsx` — the **Submit button is disabled until the review is
  valid**, and field errors are shown.
- `search-bar.jsx` — `maxLength={200}` caps the search box.
- `page.jsx` — search/filter values go through `buildQueryString` so special
  characters are **encoded**, never injected raw into the URL.

Validation is applied on **both syntactical and semantic levels** — type/format/
length via Pydantic and HTML/JS checks, plus existence and ownership checks in
the routes.
