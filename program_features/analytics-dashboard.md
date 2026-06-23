# Analytics Dashboard

A second tab ("Analytics") turns the raw business list into at-a-glance insights —
summary numbers, a rating distribution, a distance breakdown, deals coverage, a
per-category comparison, and a top-rated leaderboard.

The key idea: **the dashboard computes everything on the frontend from data the
app already has.** There's no separate analytics API. It takes the same
`businesses` and `deals` arrays the listing view uses and derives statistics from
them in the browser (`components/analytics-dashboard.jsx`).

## What it shows

| Card | What it answers |
|---|---|
| Summary stats | How many businesses, average rating, total reviews, top category |
| Rating distribution | How many businesses sit at 5★, 4★, 3★… |
| Distance breakdown | How many are near / medium / far (needs user location) |
| Deals coverage | How many deals, and what % of businesses run one |
| Category breakdown | Count and average rating per category |
| Top rated | The five highest-rated businesses |

## How the numbers are derived

Each statistic is a small reduction over the same array. For example, the summary
block:

```jsx
const stats = {
  totalBusinesses: businesses.length,
  averageRating: businesses.length > 0
    ? (businesses.reduce((sum, b) => sum + (Number(b.rating) || 0), 0) / businesses.length).toFixed(1)
    : '0.0',
  totalReviews: businesses.reduce((sum, b) => sum + (b.review_count || 0), 0),
  topCategory: getTopCategory(businesses),
}
```

The rating distribution buckets each business by its floored rating; the category
breakdown groups by `category` and averages each group's rating:

```jsx
businesses.forEach(b => {
  const rating = Math.floor(Number(b.rating) || 0)
  if (rating >= 1 && rating <= 5) ratingDistribution[rating]++
})
```

- **It reacts to what's filtered.** Because the dashboard reads the *current*
  business array, narrowing the list (e.g. to one category) re-derives every stat
  for that subset — the analytics follow the user's filters for free.
- **Defensive number handling.** Ratings are wrapped in `Number(...) || 0` so a
  missing or non-numeric value can never `NaN`-poison a total.
- **Distance stats degrade gracefully.** The near/medium/far breakdown only
  appears when the user has shared a location; without it, that card stays empty
  rather than showing wrong numbers.


The dataset is small and already loaded, so a round-trip to a SQL aggregate would
be slower and add an endpoint to maintain. Computing in the component keeps the
analytics **instant and always in sync** with whatever the user is currently
looking at. (This mirrors the report feature, which also derives its output from
the same in-memory arrays — see **[customizable-report.md](./customizable-report.md)**.)
