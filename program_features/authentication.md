# Authentication & Authorization

Two different questions, often confused:

- **Authentication** — *who are you?* Handled by **Auth0**: the user logs in with
  Google or email/password, and the app gets back a verified identity.
- **Authorization** — *are you allowed to do this?* Handled in our own backend:
  even once we know who you are, you can only edit *your own* reviews and
  favorites.

The app does both.

## Logging in (Auth0)

We don't store passwords ourselves — that's a security risk we don't want to own.
Instead the frontend hands login off to **Auth0** (`App.jsx` wraps the whole app
in `Auth0Provider`). Auth0 handles the login screen, social sign-in, and password
resets, then returns a verified user profile (a `sub` id, email, name, picture).

## Syncing the user into our database

Auth0 knows who you are, but our own tables (reviews, favorites) need a local
`user_id` to attach rows to. So the first time someone logs in, the frontend
POSTs their Auth0 profile to `/auth/sync-user`, which **creates the user if new,
or updates them if returning** (`backend/app.py`):

```python
cursor.execute('SELECT * FROM users WHERE auth0_id = %s', (auth0_id,))
user = cursor.fetchone()
if user:
    # update name/email/picture, return existing local id
else:
    # INSERT a new row, return the new local id
```

The incoming profile is validated first by the `AuthSyncUser` Pydantic model
(`backend/validation.py`) — it requires a `sub` and a valid-looking `email`, and ignores
the many extra fields Auth0 sends that we don't use. After this, every user has a
stable local `id` that the rest of the app uses.

## Authorization — the ownership check

This is the part that matters most. Knowing *who* you are isn't enough; the
backend also enforces *what you're allowed to touch*. A small helper resolves the
caller's local id from a header on every protected request (`backend/validation.py`):

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
before doing anything (`backend/app.py`):

```python
# editing a review you don't own → blocked
if user_id is None or existing['user_id'] != user_id:
    return jsonify({'error': 'Not authorized to modify this review'}), 403

# viewing or changing someone else's favorites → blocked
if current_user_id(cursor) != user_id:
    return jsonify({'error': 'Not authorized to modify these favorites'}), 403
```

- **The check is on the *server*, not the screen.** Hiding an "edit" button in the
  UI is a courtesy, not security — anyone can call the API directly. The real
  guard is here, where it can't be bypassed.
- **`403` vs `404`.** A missing review returns **404 Not Found**; a review that
  exists but isn't yours returns **403 Forbidden**. Different problems, different
  answers.

## Where each piece lives

| Concern | Where |
|---|---|
| Login UI, social sign-in, sessions | **Auth0** (`App.jsx`) |
| Create/update the local user record | `/auth/sync-user` (`backend/app.py`) |
| Validate the incoming profile | `AuthSyncUser` (`backend/validation.py`) |
| Resolve "who is calling?" | `current_user_id()` (`backend/validation.py`) |
| Enforce "can they do this?" | ownership checks in reviews/favorites routes (`backend/app.py`) |
