# Reviews, Favorites & Deals

These are the three ways users interact *with* a business once they've found it.
All three follow the same backbone: a REST endpoint in `backend/app.py`, a PostgreSQL
table linked by foreign keys, and (for the two that change user data) an
ownership check.

## Reviews — full CRUD

Reviews are the richest feature: users can **C**reate, **R**ead, **U**pdate, and
**D**elete them.

| Action | Endpoint | Notes |
|---|---|---|
| Read | `GET /get_reviews/<id>` | newest first |
| Create | `POST /add_reviews` | validated + business must exist |
| Update | `PUT /update_reviews/<id>` | owner only |
| Delete | `DELETE /delete_reviews/<id>` | owner only |

Creating a review shows the **two-layer validation** the app uses everywhere —
first the *shape* (Pydantic), then the *meaning* (database) (`backend/app.py`):

```python
review, errors = validate(ReviewCreate, request.json)   # 1. shape: rating 1-5, comment 10-500
if errors:
    return jsonify({'errors': errors}), 400

cursor.execute('SELECT id FROM businesses WHERE id = %s', (review.business,))
if not cursor.fetchone():                                # 2. meaning: does that business exist?
    return jsonify({'errors': ['business: does not exist']}), 400
```

Updating and deleting add the **ownership check** — you can only touch a review
you wrote:

```python
if user_id is None or existing['user_id'] != user_id:
    return jsonify({'error': 'Not authorized to modify this review'}), 403
```

Two helper endpoints keep a business's headline numbers fresh:
`GET /get_rating/<id>` recomputes the average with `AVG(rating)`, and
`GET /get_review_count/<id>` recounts — both write the result back onto the
`businesses` row so the card and analytics stay accurate.

> Validation details (the `ReviewCreate` model, semantic checks) live in
> **[input-validation.md](./input-validation.md)**; the ownership rule lives in
> **[authentication.md](./authentication.md)**.

## Favorites — a personal saved list

A favorite is just a link between a user and a business, so the table is a simple
join row. Adding one is guarded on three fronts (`backend/app.py`):

```python
fav, errors = validate(FavoriteCreate, request.json)         # shape
if current_user_id(cursor) != fav.user_id:                   # authorization
    return jsonify({'error': 'Not authorized ...'}), 403
cursor.execute('SELECT id FROM businesses WHERE id = %s', (fav.business_id,))
if not cursor.fetchone():                                    # business exists
    return jsonify({'errors': ['business_id: does not exist']}), 400
```

- **You can't favorite the same business twice.** The database enforces this with
  a unique constraint, and the route turns the resulting error into a friendly
  `"Already favorited"` instead of a crash.
- **Reading is protected too.** `GET /favorites/<user_id>` checks
  `current_user_id` first — you can't peek at someone else's saved list.

The companion endpoints are `DELETE /favorites/<user_id>/<business_id>` (remove)
and `GET /favorites/check/<user_id>/<business_id>` (is this one saved?), which the
heart icon on each card uses.

## Deals — read-only promotions

Deals are promotions a business offers (a discount + a code). Users only *read*
them, so there's no validation or ownership to worry about — but the queries do
real work to show only **currently valid** deals:

```sql
SELECT * FROM deals
WHERE business_id = %s AND is_active = TRUE
AND (end_date IS NULL OR end_date >= CURRENT_DATE)
ORDER BY created_at DESC
```

- **`GET /deals/business/<id>`** — active deals for one business (its detail page).
- **`GET /deals/active`** — every active deal across the site, **joined** to the
  business so each one shows its name and category (this powers the deals view and
  the analytics "deals" card).

The `end_date >= CURRENT_DATE` clause means expired deals silently disappear with
no cleanup job — the query itself is the filter.

## The shared pattern

Across all three features:

1. **Foreign keys** tie everything together — a review and a favorite each belong
   to a `user` and a `business`; a deal belongs to a `business`.
2. **Parameterized SQL** (`%s`) everywhere — never string-built queries.
3. **Anything that changes user data is authorized**; read-only public data
   (deals) isn't gated.
4. **The voice assistant reaches these same endpoints** through its MCP tools, so
   "add a review" or "what deals are there?" run identical logic to the buttons.
