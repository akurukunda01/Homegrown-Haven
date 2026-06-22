# HomegrownHaven — Rubric Alignment

Maps each **Coding & Programming** rubric requirement to the part(s) of the
application that satisfy it, and assesses whether it reaches the **max-points
(Exceeds Expectations)** bar. Scores I previously earned are intentionally
ignored — this evaluates each requirement against its own top criteria.

Legend: ✅ meets the max bar · 🟡 close, but a gap to close · ⬜ depends on the
live presentation (not the code).

---

## Code Quality

### Coding language selection — max 5
**Max bar:** Language presented with a *detailed explanation of the selection
process using industry terminology.*
- **Where:** `README.md` (Technology Stack table), `.claude/CLAUDE.md` (Tech
  Stack section). React 19 + Vite, Flask, PostgreSQL, LiveKit, Pydantic.
- **Assessment:** ⬜ The artifacts list the stack; the *detailed explanation*
  (why React over alternatives, why Flask, why PostgreSQL) is delivered in the
  presentation. The code supports it but the points come from how you explain it.

### Comments, naming conventions, formatting — max 5
**Max bar:** Comments are *logical, useful, and complete.*
- **Where:** Section banners and intent comments across `app.py`
  (e.g. `# Syntactic validation`, `# Semantic validation: business must exist`),
  docstrings in `validation.py`, explanatory comments in
  `homegrown-haven/src/utils/validators.js` and `components/report-fields.js`.
  Consistent camelCase (JS) / snake_case (Python) naming.
- **Assessment:** ✅ Comments explain *why*, not just *what*; ESLint enforces
  formatting (`npm run lint`).

### Program is modular (logical + readable) — max 10
**Max bar:** Program exhibits *advanced knowledge of programming.*
- **Where:** Clear three-tier separation — React components
  (`homegrown-haven/src/components/`, one self-contained component per concern),
  Flask REST API (`app.py`), Pydantic validation layer (`validation.py`),
  voice agent (`voice_chat.py`) + MCP tool server (`voice_mcp/main.py`). Shared
  logic factored into helpers (`utils/validators.js`, `report-fields.js`).
- **Assessment:** ✅ Real-time WebSocket relay, MCP tool architecture, and a
  separate validation module demonstrate advanced patterns.

---

## User Experience

### UX Design: User Journey, Design Rationale, Accessibility — max 10
**Max bar:** UX design presented with details on *design rationale, user
journey, and accessibility features* highlighted.
- **Where:** `components/about-page.jsx`, the overall flow
  (`page.jsx`: search → filter → detail → review/favorite), accessibility via
  `aria-label`s (e.g. search/filter/export buttons in `page.jsx`,
  `report-config.jsx`), keyboard-focusable controls, semantic color contrast.
- **Assessment:** 🟡 Features exist, but the **judge specifically flagged using
  the *exact rubric terminology*** ("User Journey", "Design Rationale",
  "Accessibility Features") on the UX page. **Action:** label these three terms
  explicitly in the About/UX page and presentation.

### UI is intuitive / clear instructions — max 5
**Max bar:** Program is *intuitive AND clear instructions are provided.*
- **Where:** Self-evident layout (`page.jsx`), tab navigation (Businesses /
  Analytics / About), placeholder hints in `search-bar.jsx`, the voice assistant
  for guided use.
- **Assessment:** ✅ Intuitive; ensure on-screen/spoken instructions are shown.

### Users can easily navigate between pages — max 5
**Max bar:** Includes an *intelligent feature such as an interactive Q&A.*
- **Where:** The **AI voice assistant** is the intelligent feature — LiveKit +
  MCP tools (`voice_chat.py`, `voice_mcp/main.py`) let users navigate, search,
  filter, review, and favorite by natural-language voice command (interactive
  Q&A). Tab + back navigation in `page.jsx`.
- **Assessment:** ✅ The voice agent clearly satisfies the "intelligent feature"
  top criterion.

### User input is validated — max 5
**Max bar:** Input validation applied on *both syntactical and semantic levels.*
- **Where:** **Backend** — `validation.py` Pydantic models give *syntactic*
  validation (types, lengths, ranges, email format); `app.py` routes add
  *semantic* validation (business/review existence, ownership/authorization →
  403). **Frontend** — `utils/validators.js` (`validateReview`,
  `buildQueryString`), disabled-until-valid review submit in
  `business-detail.jsx`, encoded query params + `maxLength` search.
- **Assessment:** ✅ This was just implemented across both tiers — directly
  hits the "both syntactical and semantic" max bar. (See `RUBRIC_ALIGNMENT`
  note: previously the weakest item.)

---

## Functionality

### Program addresses all parts of the prompt — max 10
**Max bar:** Fully addresses the topic AND the *correlation is explained in the
instructions.*
- **Where:** Local-business discovery platform — search/filter
  (`search_local`, `get_local`), reviews, favorites, deals, analytics, voice
  navigation. Covered end-to-end in `README.md`.
- **Assessment:** ✅ on coverage; ⬜ the *correlation explanation* is a
  presentation/README item — make the topic→feature mapping explicit.

### Program generates a presentable report — max 10
**Max bar:** Output reports *allow the user to customize and analyze* info.
- **Where:** The **customizable report** in `report-config.jsx` +
  `report-fields.js` + `generateReport` in `page.jsx`: user picks columns, data
  scope, sort order, and format (CSV / JSON / printable PDF). The Analytics
  dashboard (`analytics-dashboard.jsx`) provides analysis views.
- **Assessment:** ✅ Now meets the max bar. **This directly resolves the judge's
  note "Report can't be customized before exporting"** — customization now
  happens in a panel *before* export.

### Data storage — max 5
**Max bar:** *Complex storage such as arrays and lists used where appropriate,
and variable scope makes sense.*
- **Where:** PostgreSQL with typed columns and indexes (`db.sql`); Python lists
  / dicts in `app.py`; React state arrays (`businesses`, `allDeals`,
  `favorites`) in `page.jsx`; the `FIELD_DEFS` array in `report-fields.js`;
  Pydantic models as structured types. Scoped state per component.
- **Assessment:** ✅ Arrays/lists used appropriately; clear variable scope.

---

## Presentation (delivery-based — not in the code)

These four come from the live delivery, not the application:
- **Statements well-organized** (max 10) — ⬜ presentation.
- **Confidence / body language / eye contact / voice** (max 10) — ⬜ presentation.
- **Effectively answers questions** (max 10) — ⬜ presentation.
- **Adherence to Competitive Events Guidelines** (10, all-or-nothing) — ⬜ follow
  the device/topic/setup checklist on the rating sheet.

---

## Summary — where the code already hits max vs. needs attention

| Requirement | In-code max bar met? |
|---|---|
| Comments / naming / formatting | ✅ |
| Modularity (advanced knowledge) | ✅ |
| Navigation — intelligent feature (voice Q&A) | ✅ |
| Input validation (syntactic + semantic) | ✅ (just added) |
| Customizable report | ✅ (just added — resolves judge note) |
| Data storage (arrays/lists/scope) | ✅ |
| UI intuitive / instructions | ✅ |
| **UX page — exact rubric terminology** | 🟡 **judge-flagged: add the exact terms** |
| Language selection (detailed explanation) | ⬜ presentation |
| Prompt correlation explained | ⬜ presentation/README |

**Top remaining code/doc action:** on the UX/About page, explicitly use the
rubric's exact terms — **"User Journey," "Design Rationale," "Accessibility
Features"** — the one in-app item the judge called out.
