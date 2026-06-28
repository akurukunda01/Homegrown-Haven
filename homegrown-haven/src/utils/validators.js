// Shared client-side validation helpers.
// Client-side checks are for UX only — the Flask backend re-validates everything.

export const SEARCH_MAX = 200;
export const COMMENT_MIN = 10;
export const COMMENT_MAX = 500;

// Validate a review draft ({ rating, comment }). Returns an errors object;
// empty object means valid.
export function validateReview(review) {
  const errors = {};

  if (!review.rating || review.rating < 1 || review.rating > 5) {
    errors.rating = 'Please select a rating between 1 and 5 stars';
  }

  const comment = (review.comment || '').trim();
  if (!comment) {
    errors.comment = 'Comment is required';
  } else if (comment.length < COMMENT_MIN) {
    errors.comment = `Comment must be at least ${COMMENT_MIN} characters`;
  } else if (comment.length > COMMENT_MAX) {
    errors.comment = `Comment must not exceed ${COMMENT_MAX} characters`;
  }

  return errors;
}

// Build a safe, URL-encoded query string from a params object, skipping
// null/undefined/'' values. Prevents raw interpolation of user input.
export function buildQueryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      search.append(key, value);
    }
  });
  return search.toString();
}

// Format a value as a CSV cell: coerce to string, guard against CSV/formula
// injection (prefix a quote when the value starts with = + - @), and escape
// embedded double-quotes by doubling them, then wrap the whole cell in quotes.
export function csvCell(value) {
  let str = String(value ?? '');
  if (/^[=+\-@]/.test(str)) str = `'${str}`;
  return `"${str.replace(/"/g, '""')}"`;
}
