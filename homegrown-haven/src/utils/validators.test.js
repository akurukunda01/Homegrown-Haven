import { describe, it, expect } from 'vitest';
import { validateReview, buildQueryString, csvCell, COMMENT_MIN, COMMENT_MAX } from './validators';

describe('validateReview', () => {
  it('returns no errors for a valid review', () => {
    const errors = validateReview({ rating: 4, comment: 'A perfectly fine comment' });
    expect(errors).toEqual({});
  });

  it('flags a missing or zero rating', () => {
    expect(validateReview({ rating: 0, comment: 'A perfectly fine comment' }).rating).toBeDefined();
    expect(validateReview({ comment: 'A perfectly fine comment' }).rating).toBeDefined();
  });

  it('flags an out-of-range rating', () => {
    expect(validateReview({ rating: 6, comment: 'A perfectly fine comment' }).rating).toBeDefined();
    expect(validateReview({ rating: -1, comment: 'A perfectly fine comment' }).rating).toBeDefined();
  });

  it('requires a non-empty comment', () => {
    expect(validateReview({ rating: 3, comment: '' }).comment).toBe('Comment is required');
    expect(validateReview({ rating: 3, comment: '    ' }).comment).toBe('Comment is required');
  });

  it('rejects a comment shorter than the minimum', () => {
    const errors = validateReview({ rating: 3, comment: 'short' });
    expect(errors.comment).toContain(String(COMMENT_MIN));
  });

  it('rejects a comment longer than the maximum', () => {
    const errors = validateReview({ rating: 3, comment: 'x'.repeat(COMMENT_MAX + 1) });
    expect(errors.comment).toContain(String(COMMENT_MAX));
  });

  it('trims whitespace before measuring length', () => {
    const errors = validateReview({ rating: 3, comment: '   tooshort   ' });
    expect(errors.comment).toBeDefined();
  });
});

describe('buildQueryString', () => {
  it('encodes provided params', () => {
    expect(buildQueryString({ q: 'coffee', category: 'Cafe' })).toBe('q=coffee&category=Cafe');
  });

  it('skips null, undefined, and empty-string values', () => {
    const qs = buildQueryString({ q: 'coffee', category: '', min_rating: null, lat: undefined });
    expect(qs).toBe('q=coffee');
  });

  it('URL-encodes special characters', () => {
    expect(buildQueryString({ q: 'tea & crumpets' })).toBe('q=tea+%26+crumpets');
  });

  it('returns an empty string when nothing is provided', () => {
    expect(buildQueryString({})).toBe('');
    expect(buildQueryString({ q: '', category: null })).toBe('');
  });
});

describe('csvCell', () => {
  it('wraps a plain value in double quotes', () => {
    expect(csvCell('hello')).toBe('"hello"');
  });

  it('escapes embedded double-quotes by doubling them', () => {
    expect(csvCell('he said "hi"')).toBe('"he said ""hi"""');
  });

  it('prefixes a quote to guard against formula injection', () => {
    expect(csvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"');
    expect(csvCell('+1234')).toBe('"\'+1234"');
    expect(csvCell('-5')).toBe('"\'-5"');
    expect(csvCell('@cmd')).toBe('"\'@cmd"');
  });

  it('coerces null and undefined to an empty quoted cell', () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });

  it('coerces numbers to strings', () => {
    expect(csvCell(42)).toBe('"42"');
  });
});
