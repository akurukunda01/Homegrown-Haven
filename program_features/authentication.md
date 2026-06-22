# Authentication & Authorization

- **Authentication** — andled by **Auth0**: the user logs in with
  Google or email/password, and the app gets back a verified identity.
- **Authorization** — Handled in our own backend:
  you can only edit *your own* reviews and
  favorites.


## Auth0

The frontend hands login off to **Auth0** (`App.jsx` wraps the whole app
in `Auth0Provider`). Auth0 handles the login screen, social sign-in, and password
resets, then returns a verified user profile (a `sub` id, email, name, picture).

## Syncing the user into our database

Auth0 knows who you are, but our own tables (reviews, favorites) need a local
`user_id` to attach rows to. So the first time someone logs in, the frontend
POSTs their Auth0 profile to `/auth/sync-user`, which **creates the user if new,
or updates them if returning** (`app.py`):

```python
cursor.execute('SELECT * FROM users WHERE auth0_id = %s', (auth0_id,))
user = cursor.fetchone()
if user:
    # update name/email/picture, return existing local id
else:
    # INSERT a new row, return the new local id
```

The incoming profile is validated first by the `AuthSyncUser` Pydantic model
(`validation.py`) — it requires a `sub` and a valid-looking `email`, and ignores
the many extra fields Auth0 sends that we don't use. After this, every user has a
stable local `id` that the rest of the app uses.

## Authorization 
A small helper resolves the
caller's local id from a header on every protected request (`validation.py`):

```python
def current_user_id(cursor):
    """Resolve the caller's local user id from the X-Auth0-User-ID header."""
    auth0_id = request.headers.get("X-Auth0-User-ID")
    if not auth0_id:
        return None
    cursor.execute("SELECT id FROM users WHERE auth0_id = %s", (auth0_id,))
    row = cursor.fetchone()
    return row["id"] if row else None
```

Then every route that changes user-owned data compares that id to the row's owner
before doing anything (`app.py`):

```python
# editing a review you don't own → blocked
if user_id is None or existing['user_id'] != user_id:
    return jsonify({'error': 'Not authorized to modify this review'}), 403

# viewing or changing someone else's favorites → blocked
if current_user_id(cursor) != user_id:
    return jsonify({'error': 'Not authorized to modify these favorites'}), 403
```




| Concern | Where |
|---|---|
| Login UI, social sign-in, sessions | **Auth0** (`App.jsx`) |
| Create/update the local user record | `/auth/sync-user` (`app.py`) |
| Validate the incoming profile | `AuthSyncUser` (`validation.py`) |
| Resolve "who is calling?" | `current_user_id()` (`validation.py`) |
| Enforce "can they do this?" | ownership checks in reviews/favorites routes (`app.py`) |
