# Feature Documentation

Deep-dives into how each part of **HomegrownHaven** actually works — written to be
read on their own, without a tour guide. The root [`../README.md`](../README.md)
covers setup and the big picture; this folder explains the *how* and *why* behind
each feature.

## Features

| Doc | What it covers |
|---|---|
| [search-and-discovery.md](./search-and-discovery.md) | Searching, filtering, and the Haversine distance math that sorts businesses nearest-first |
| [reviews-favorites-deals.md](./reviews-favorites-deals.md) | The three core user actions — full review CRUD, saved favorites, and active deals |
| [customizable-report.md](./customizable-report.md) | User-built reports: pick columns, scope, sort, and export to CSV / JSON / PDF |
| [analytics-dashboard.md](./analytics-dashboard.md) | The Analytics tab — stats derived in the browser from the current business list |
| [intelligent-voice-feature/](./intelligent-voice-feature/overview.md) | The AI voice assistant that can both talk and drive the screen (3 docs, see below) |



| Doc | What it covers |
|---|---|
| [authentication.md](./authentication.md) | Auth0 login, syncing users locally, and the ownership checks that gate user data |
| [input-validation.md](./input-validation.md) | Two-layer validation — syntactic (Pydantic) and semantic (database) |
| [data-storage.md](./data-storage.md) | How data is stored and shaped across the database, backend, and frontend layers |
| [comments-and-conventions.md](./comments-and-conventions.md) | Code style, naming, comments, and automated linting |

## The voice assistant (sub-folder)

The standout feature has its own three-part breakdown in
[`intelligent-voice-feature/`](./intelligent-voice-feature/overview.md):

- **[overview.md](./intelligent-voice-feature/overview.md)** — the full user flow and how the pieces fit
- **[mcp.md](./intelligent-voice-feature/mcp.md)** — the tools the assistant uses to take action
- **[websockets.md](./intelligent-voice-feature/websockets.md)** — how the assistant drives the screen live



Several features lean on the same foundations, so the docs link to each other:

- **Validation** and **authentication** are reused by reviews, favorites, and search.
- The **voice assistant** calls the very same endpoints behind search, reviews,
  favorites, and deals — so voice and clicks always behave identically.
- The **report** and **analytics** features both derive their output from the same
  in-memory business data the listing already loaded.
