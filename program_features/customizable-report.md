# Customizable Report

Users can generate their own business report for data analysis in addition to navigating the analytics tab of the site.

- **Columns** — which fields to include (Name, Category, Rating, Email, etc.).
- **Data scope** — which businesses (current list, all, favorites only, or only
  ones with deals).
- **Sort order** — by rating, name, distance, or reviews; ascending/descending.
- **Format** — download as **CSV**, **JSON**, or open a **printable / PDF** view.


## Technical details

### Files
| File | Job |
|---|---|
| `homegrown-haven/src/components/report-config.jsx` | The slide-out panel UI (column toggles, scope, sort, format). |
| `homegrown-haven/src/components/report-fields.js` | The shared list of available fields + default settings. |
| `homegrown-haven/src/page.jsx` (`generateReport`) | Builds and downloads the actual file. |

### 1. The field catalog (`report-fields.js`)
A single array defines every possible column and *how to read it* from a
business. This same array drives the on-screen toggles and the file output,
so they can never drift apart:

```js
export const FIELD_DEFS = [
  { key: 'name',   label: 'Name',   group: 'Basic',   accessor: (b) => b.name ?? '' },
  { key: 'rating', label: 'Rating', group: 'Metrics', accessor: (b) => b.rating ?? 'N/A' },
  // ...
];
```

### 2. The user's choices (`reportConfig`)
The user's choices live in one object:

```js
{ columns: { name: true, rating: true, ... }, scope: 'current',
  sortBy: 'rating', sortOrder: 'desc', format: 'csv' }
```

### 3. Generating the report (`page.jsx` → `generateReport`)
The function (1) picks the rows for the chosen **scope**, (2) **sorts** them,
(3) keeps only the **selected columns**, then (4) outputs the chosen **format**:

```js
const fields = FIELD_DEFS.filter(f => config.columns[f.key]);   // chosen columns
// CSV  -> escaped text file      JSON -> structured data
// print-> new window + window.print() (browser "Save as PDF")
```

CSV cells are safely escaped (quotes doubled, and values starting with `= + - @`
are neutralized) to prevent broken or unsafe spreadsheets.

### User Flow
1. Click **Export** --> the panel slides out.
2. Toggle columns / pick scope / sort / format 
3. Click **Generate** --> file downloads (CSV/JSON) or a print dialog opens (PDF).


