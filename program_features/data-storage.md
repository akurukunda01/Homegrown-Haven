# Data Storage


HomegrownHaven stores data in three layers:

1. **The database (long-term memory)** — a PostgreSQL database keeps everything
   permanent: businesses, users, reviews, favorites, and deals. This survives
   even after the app is closed.
2. **The backend (in-transit data)** — when the Flask server answers a request,
   it pulls rows from the database into Python **lists** and **dictionaries**,
   shapes them, and sends them out.
3. **The frontend (live screen data)** — the React app holds what you currently
   see on screen in **state variables** (arrays and objects). When this data
   changes, the screen updates automatically.

Think of it as: **database = filing cabinet**, **backend = the clerk carrying
folders**, **frontend = the papers laid out on your desk**.

---

## Technical details

### 1. Database layer — PostgreSQL (`db.sql`, `app.py`)
Five related tables: `businesses`, `users`, `reviews`, `favorites`, `deals`.
Each column uses the correct data type (e.g. `rating DECIMAL`, `created_at
TIMESTAMP`, `latitude/longitude` numeric), and tables are linked by foreign keys
(a review belongs to a business and a user).

Rows are read using parameterized queries through a shared connection helper so
results come back as dictionaries:

```python
# app.py — RealDictCursor returns each row as a dict, not a tuple
g.cursor = g.db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
```

### 2. Backend layer — Python lists & dicts (`app.py`, `validation.py`)
Query results become **lists of dictionaries** that are filtered/sorted in
memory before being returned as JSON:

```python
businesses = cursor.fetchall()                      # list[dict]
businesses = sorted(businesses, key=lambda x: x.get('distance_value', 999))
```

Structured request data is held in **Pydantic models** (typed objects) so each
field has a guaranteed type — see `validation.py` (`ReviewCreate`,
`BusinessQuery`, etc.).

### 3. Frontend layer — React state (`homegrown-haven/src/page.jsx`)
Live UI data lives in `useState` variables. Lists use **arrays**; grouped
settings use **objects**:

```jsx
const [businesses, setBusinesses]   = useState([])      // array of businesses
const [allDeals, setAllDeals]       = useState([])      // array of deals
const [favorites, setFavorites]     = useState([])      // array of favorites
const [filters, setFilters]         = useState({ category: 'all', minRating: 0, ... })
const [reportConfig, setReportConfig] = useState(DEFAULT_REPORT_CONFIG)
```

A fixed reference array is used for report fields (`report-fields.js`):

```js
export const FIELD_DEFS = [
  { key: 'name', label: 'Name', group: 'Basic', accessor: (b) => b.name ?? '' },
  // ...one entry per available column
];
```

### Why this meets the bar
- **Arrays and lists** are used where appropriate (business/deal/favorite
  collections, `FIELD_DEFS`).
- **Each variable has one clear job** and the **correct data type** (numbers for
  ratings, arrays for lists, objects for grouped settings).
- **Variable scope makes sense**: database access is scoped to a request,
  React state is scoped to the component that owns it, and helper values are
  scoped to their function.
