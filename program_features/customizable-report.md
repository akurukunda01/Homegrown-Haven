# Customizable Report

## In plain English

Users can build their **own** business report instead of getting one fixed
export. A slide-out panel lets them choose:

- **Columns** — which fields to include (Name, Category, Rating, Email, etc.).
- **Data scope** — which businesses (current list, all, favorites only, or only
  ones with deals).
- **Sort order** — by rating, name, distance, or reviews; ascending/descending.
- **Format** — download as **CSV**, **JSON**, or open a **printable / PDF** view.

They set everything up first, see a live row count, then click **Generate** to
download or print. This is what lets the report be *customized and analyzed*, not
just dumped out.

---

## Technical details

### The pieces
| File | Job |
|---|---|
| `homegrown-haven/src/components/report-config.jsx` | The slide-out panel UI (column toggles, scope, sort, format). |
| `homegrown-haven/src/components/report-fields.js` | The shared list of available fields + default settings. |
| `homegrown-haven/src/page.jsx` (`generateReport`) | Builds and downloads the actual file. |

### 1. One source of truth for fields (`report-fields.js`)
A single array defines every possible column and *how to read it* from a
business. This same array drives the on-screen toggles **and** the file output,
so they can never drift apart:

```js
export const FIELD_DEFS = [
  { key: 'name',   label: 'Name',   group: 'Basic',   accessor: (b) => b.name ?? '' },
  { key: 'rating', label: 'Rating', group: 'Metrics', accessor: (b) => b.rating ?? 'N/A' },
  // ...
];
```

### 2. The settings object (`reportConfig`)
The user's choices live in one object:

```js
{ columns: { name: true, rating: true, ... }, scope: 'current',
  sortBy: 'rating', sortOrder: 'desc', format: 'csv' }
```

### 3. Generating the report (`page.jsx → generateReport`)
The function (1) picks the rows for the chosen **scope**, (2) **sorts** them,
(3) keeps only the **selected columns**, then (4) outputs the chosen **format**:

```js
const fields = FIELD_DEFS.filter(f => config.columns[f.key]);   // chosen columns
// CSV  -> escaped text file      JSON -> structured data
// print-> new window + window.print() (browser "Save as PDF")
```

CSV cells are safely escaped (quotes doubled, and values starting with `= + - @`
are neutralized) to prevent broken or unsafe spreadsheets.

### How it works for the user (workflow)
1. Click **Export** → the panel slides out.
2. Toggle columns / pick scope / sort / format → the **Generate (N)** button
   shows the live row count.
3. Click **Generate** → file downloads (CSV/JSON) or a print dialog opens (PDF).

### Why this meets the bar
The report **allows the user to customize and analyze information** (columns,
which records, ordering, and output format are all user-controlled) — the
top-level criterion for the "presentable report" requirement.
