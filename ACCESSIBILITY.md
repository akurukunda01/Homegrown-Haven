# Accessibility

This document describes the accessibility features of the HomegrownHaven frontend
(`homegrown-haven/`), how to verify them, and the known limitations / future work.

The goal of the current pass was to make the **core flows usable by keyboard and
screen-reader users** without changing the visual design.

## Implemented

### Keyboard operability
- **Business cards are fully keyboard-operable.** Each card (`business-card.jsx`) exposes
  `role="button"`, `tabIndex={0}`, an `aria-label` ("View details for &lt;name&gt;"), and an
  `onKeyDown` handler so **Enter** and **Space** open the detail view — matching the mouse
  click. A visible focus ring (`focus:ring-2`) shows where keyboard focus is.
- **Interactive star rating** in the review form (`business-detail.jsx`) renders real
  `<button>` elements (was non-focusable icons), each with an `aria-label` like
  "Rate 3 stars", so a rating can be chosen by keyboard.
- **All other controls are native `<button>`s**, which are focusable and respond to
  Enter/Space for free (nav, filters, report, AI assistant, review submit/cancel).

### Names & labels (screen readers)
- **Form inputs are associated with their labels** via `htmlFor` / `id`:
  - Filter panel selects — Category, Minimum Rating, Maximum Distance (`business-filter.jsx`).
  - Report config — Sort By select, with the secondary sort-order select given its own
    `aria-label` (`report-config.jsx`).
  - Review form — the comment `<textarea>` (`business-detail.jsx`).
- **Icon-only buttons have accessible names** via `aria-label`: the favorite heart
  (dynamic "Add to favorites" / "Remove from favorites"), open/close filters, customize/
  export report, and the AI assistant start/stop buttons.
- **The search box has an `aria-label`** ("Search businesses, categories, or cuisines")
  in addition to its placeholder.
- **Images use meaningful `alt` text** (the business name / page title).
- Headings that sit above groups of buttons (Favorites, Deals, Data Scope, Format,
  Columns) are plain text headings rather than mislabeled `<label>` elements.

### Tooltips
- Icon-only buttons carry a `title` attribute (mirroring their `aria-label`) so sighted
  mouse users get a hover hint: favorite heart, Filters, Export, AI assistant, and the
  panel close buttons.

## How to verify

Run the app (`cd homegrown-haven && npm run dev`) and use the keyboard only:

1. Press **Tab** to move focus onto a business card — a green focus ring appears.
2. Press **Enter** (or **Space**) — the business detail view opens. Both keys work.
3. **Tab** to the heart icon on a card and press **Space** — it toggles favorite
   *without* opening the card.
4. Open the filter panel and **Tab** through it — every select is reachable and its
   visible label is announced by a screen reader.
5. In the review form, **Tab** to the star rating and activate a star with **Enter**.

Optional screen-reader spot check (macOS VoiceOver, **Cmd+F5**): focus the card, heart,
and search box and confirm each announces a clear name.

## Known limitations / future work

These were intentionally left out of the current pass and are good next steps:

- **The filter and report slide-over panels are not modal dialogs yet** — they lack
  `role="dialog"` / `aria-modal`, focus is not trapped inside them, **Esc** does not close
  them, and focus is not returned to the trigger button on close.
- **No skip-to-content link** for keyboard users to bypass the header.
- The interactive star rating supports click/Enter activation but not arrow-key
  navigation between stars (a common richer pattern).
- No automated accessibility tests (e.g. axe / jest-axe) are wired up; verification is
  currently manual.
