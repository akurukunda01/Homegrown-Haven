# Comments & Coding Conventions



The code is written so a reader can follow it quickly:

- **Comments explain *why*, not *what*.** The code already shows *what* it does;
  comments add the reasoning a reader can't guess.
- **Names describe their job.** Variables and functions are named for what they
  hold or do, so the code reads almost like sentences.
- **Consistent style per language.** Python and JavaScript each follow their
  standard naming style, and formatting is checked automatically.

The goal: a judge or new developer can open any file and understand it without a
tour guide.

---

## Technical details

### 1. Comments explain intent 
Short comments mark *purpose*, especially around non-obvious logic:

```python
# backend/app.py
# Guard against CSV injection and escape embedded quotes/newlines.
# Authorization: caller may only modify their own favorites
```
```js
// page.jsx
// Row counts per scope, for the report panel's live labels.
```

### 2. Docstrings for modules and functions
Python files and functions start with a docstring describing their role:

```python
# backend/validation.py
"""Request validation for the HomegrownHaven Flask API.
Pydantic models provide *syntactic* validation; routes add *semantic* checks."""

def current_user_id(cursor):
    """Resolve the caller's local user id from the X-Auth0-User-ID header."""
```

### 3. Naming conventions
| Language | Style | Example |
|---|---|---|
| Python | `snake_case` functions/vars, `PascalCase` classes | `current_user_id`, `ReviewCreate` |
| JavaScript | `camelCase` functions/vars | `generateReport`, `buildQueryString` |
| React components | `PascalCase` | `ReportConfig`, `BusinessDetail` |
| Constants | `UPPER_SNAKE_CASE` | `FIELD_DEFS`, `SEARCH_MAX` |

### 4. Section banners for navigation
Larger files group related code under labeled sections, e.g. in `backend/app.py`:

```python
# ==================== FAVORITES ROUTES ====================
```

### 5. Automated formatting
The frontend uses **ESLint** (`npm run lint` in `homegrown-haven/`) to keep
formatting and basic quality consistent, so style isn't left to chance.

