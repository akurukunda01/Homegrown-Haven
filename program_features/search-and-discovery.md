# Search, Filtering & Distance

The core of HomegrownHaven is finding local businesses. Users can search by name,
narrow by category and rating, and — when they share their location — see how far
away each business is and have the list sorted nearest-first.

- **Search** — type a name; matches are case-insensitive and partial ("coff"
  finds "Coffee House").
- **Filter** — by category, by minimum rating, and by maximum distance.
- **Sort** — by distance when location is known, otherwise by rating.

## How a search request flows

The frontend builds a query string and hits one of two endpoints —
`/search_local` (with a name query) or `/get_local` (browse all). Both share the
same validation, distance, and sorting logic.

```
search box / filters (page.jsx)
   → GET /search_local?q=coffee&category=cafe&min_rating=4&lat=..&lng=..
      → validate params (BusinessQuery)
      → SQL: name ILIKE %coffee% AND category = 'cafe' AND rating >= 4
      → add distance to each row (if location given)
      → sort + return JSON
```

## Validated, parameterized queries

Every query parameter is first parsed by the `BusinessQuery` model
(`backend/validation.py`), which enforces sane ranges before any SQL runs:

```python
class BusinessQuery(BaseModel):
    q:            Optional[str]   = Field(default=None, max_length=200)
    category:     Optional[str]   = Field(default=None, max_length=100)
    min_rating:   Optional[float] = Field(default=None, ge=0, le=5)
    max_distance: Optional[float] = Field(default=None, ge=0)
    lat:          Optional[float] = Field(default=None, ge=-90,  le=90)
    lng:          Optional[float] = Field(default=None, ge=-180, le=180)
```

The SQL itself is built with **parameterized placeholders** (`%s`), never string
concatenation, so user input can't be injected into the query (`backend/app.py`):

```python
sql = "SELECT * FROM businesses WHERE name ILIKE %s AND latitude IS NOT NULL ..."
params = [f'%{query}%']
if category and category != 'all':
    sql += " AND category = %s"
    params.append(category)
cursor.execute(sql, params)        # values are bound, not pasted in
```

- **`ILIKE` does case-insensitive matching**, and the `%query%` wrapping makes it
  a "contains" search instead of an exact match.
- **`'all'` is treated as "no filter."** The frontend sends `category=all` to mean
  "everything," so the backend simply skips that clause.

## Distance — the Haversine formula

A rating filter is easy SQL. Distance is not, because the database stores
latitude/longitude, not miles-from-*you*. We compute that in Python using the
**Haversine formula**, which measures the straight-line distance between two
points on a sphere (the Earth):

```python
def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in miles using Haversine formula"""
    R = 3959  # Earth's radius in miles
    lat1_rad, lat2_rad = math.radians(lat1), math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    a = (math.sin(delta_lat/2)**2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return round(R * c, 1)
```

For each business, the distance from the user is calculated and attached to the
result as both a display string (`"1.4 mi"`) and a raw number (`distance_value`)
used for filtering and sorting:

```python
business['distance']       = f"{distance} mi"
business['distance_value'] = distance
```

## Filtering and sorting the results

Once distances exist, the list is filtered to those within `max_distance` and
sorted nearest-first. If the user *hasn't* shared a location, there's nothing to
measure, so the list falls back to sorting by rating (`backend/app.py`):

```python
if user_lat and user_lng:
    businesses = [b for b in businesses if b.get('distance_value', 999) <= max_distance]
    businesses = sorted(businesses, key=lambda x: x.get('distance_value', 999))
else:
    businesses = sorted(businesses, key=lambda x: x.get('rating', 0), reverse=True)
```

- **`999` is the "unknown distance" sentinel.** A business missing coordinates gets
  `distance_value = 999` so it sorts to the bottom instead of crashing the
  comparison.
- **The voice assistant reuses all of this.** When you say "find coffee shops,"
  the `search_businesses` MCP tool calls this exact endpoint — same validation,
  same distance math — so voice and clicks always agree. See
  **[intelligent-voice-feature/mcp.md](./intelligent-voice-feature/mcp.md)**.
