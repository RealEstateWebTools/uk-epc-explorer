import { describe, it, expect } from 'vitest';
import { formatDate, capitalize, RATING_COLORS, getRatingColor, getRatingTextColor, isValidUkPostcode, buildEmptyState } from '../src/utils.js';

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a standard ISO date string', () => {
    expect(formatDate('2025-04-28')).toBe('28 Apr 2025');
  });

  it('formats a datetime string, ignoring the time component', () => {
    expect(formatDate('2025-04-28 15:22:15')).toBe('28 Apr 2025');
  });

  it('returns – for an empty string', () => {
    expect(formatDate('')).toBe('–');
  });

  it('returns – for null', () => {
    expect(formatDate(null)).toBe('–');
  });

  it('returns – for undefined', () => {
    expect(formatDate(undefined)).toBe('–');
  });

  it('returns the raw string when the value is not parseable as a date', () => {
    expect(formatDate('NODATA!')).toBe('NODATA!');
  });

  it('returns the raw string for EPC-specific sentinel values', () => {
    expect(formatDate('NO DATA!')).toBe('NO DATA!');
  });

  it('handles a date at the epoch boundary (2008-01-01)', () => {
    expect(formatDate('2008-01-01')).toBe('1 Jan 2008');
  });

  it('handles a single-digit day', () => {
    expect(formatDate('2021-01-06')).toBe('6 Jan 2021');
  });
});

// ─── capitalize ──────────────────────────────────────────────────────────────

describe('capitalize', () => {
  it('capitalises a lowercase string', () => {
    expect(capitalize('house')).toBe('House');
  });

  it('lowercases everything after the first letter', () => {
    expect(capitalize('OWNER-OCCUPIED')).toBe('Owner-occupied');
  });

  it('leaves an already-capitalised string correct', () => {
    expect(capitalize('House')).toBe('House');
  });

  it('handles a single character', () => {
    expect(capitalize('a')).toBe('A');
  });

  it('returns – for an empty string', () => {
    expect(capitalize('')).toBe('–');
  });

  it('returns – for null', () => {
    expect(capitalize(null)).toBe('–');
  });

  it('returns – for undefined', () => {
    expect(capitalize(undefined)).toBe('–');
  });

  it('handles mixed case like "owner-occupied"', () => {
    expect(capitalize('owner-occupied')).toBe('Owner-occupied');
  });
});

// ─── RATING_COLORS ────────────────────────────────────────────────────────────

describe('RATING_COLORS', () => {
  it('has entries for all seven ratings A–G', () => {
    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(r => {
      expect(RATING_COLORS).toHaveProperty(r);
    });
  });

  it('A is the greenest colour', () => {
    expect(RATING_COLORS.A).toBe('#00813d');
  });

  it('G is red', () => {
    expect(RATING_COLORS.G).toBe('#e01616');
  });

  it('has exactly 7 entries', () => {
    expect(Object.keys(RATING_COLORS)).toHaveLength(7);
  });
});

// ─── getRatingColor ──────────────────────────────────────────────────────────

describe('getRatingColor', () => {
  it('returns the correct colour for each valid rating', () => {
    Object.entries(RATING_COLORS).forEach(([rating, color]) => {
      expect(getRatingColor(rating)).toBe(color);
    });
  });

  it('returns the fallback colour for an unknown rating', () => {
    expect(getRatingColor('Z')).toBe('#aaa');
  });

  it('returns the fallback colour for a lowercase rating (case-sensitive)', () => {
    expect(getRatingColor('a')).toBe('#aaa');
  });

  it('returns the fallback colour for an empty string', () => {
    expect(getRatingColor('')).toBe('#aaa');
  });

  it('returns the fallback colour for null', () => {
    expect(getRatingColor(null)).toBe('#aaa');
  });

  it('returns the fallback colour for undefined', () => {
    expect(getRatingColor(undefined)).toBe('#aaa');
  });

  it('returns the fallback colour for the "?" sentinel', () => {
    expect(getRatingColor('?')).toBe('#aaa');
  });
});

// ─── getRatingTextColor ───────────────────────────────────────────────────────

describe('getRatingTextColor', () => {
  it('returns white for A (dark green background)', () => {
    expect(getRatingTextColor('A')).toBe('#ffffff');
  });

  it('returns white for B', () => {
    expect(getRatingTextColor('B')).toBe('#ffffff');
  });

  it('returns dark for C (yellow-green — fails WCAG with white text)', () => {
    expect(getRatingTextColor('C')).toBe('#1a1a2e');
  });

  it('returns dark for D (yellow — fails WCAG with white text)', () => {
    expect(getRatingTextColor('D')).toBe('#1a1a2e');
  });

  it('returns white for E', () => {
    expect(getRatingTextColor('E')).toBe('#ffffff');
  });

  it('returns white for F', () => {
    expect(getRatingTextColor('F')).toBe('#ffffff');
  });

  it('returns white for G', () => {
    expect(getRatingTextColor('G')).toBe('#ffffff');
  });

  it('returns white for unknown ratings', () => {
    expect(getRatingTextColor('?')).toBe('#ffffff');
  });

  it('returns white for null', () => {
    expect(getRatingTextColor(null)).toBe('#ffffff');
  });
});

// ─── isValidUkPostcode ────────────────────────────────────────────────────────

describe('isValidUkPostcode', () => {
  it('accepts a standard postcode with space', () => {
    expect(isValidUkPostcode('SW1A 1AA')).toBe(true);
  });

  it('accepts a postcode without space', () => {
    expect(isValidUkPostcode('SW1A1AA')).toBe(true);
  });

  it('accepts a lowercase postcode', () => {
    expect(isValidUkPostcode('cv11 6fa')).toBe(true);
  });

  it('accepts a short-form postcode like "CV11 6FA"', () => {
    expect(isValidUkPostcode('CV11 6FA')).toBe(true);
  });

  it('rejects a plain word', () => {
    expect(isValidUkPostcode('Westminster')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidUkPostcode('')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidUkPostcode(null)).toBe(false);
  });

  it('rejects a partial postcode with only the outward code', () => {
    expect(isValidUkPostcode('SW1A')).toBe(false);
  });
});

// ─── buildEmptyState ─────────────────────────────────────────────────────────

describe('buildEmptyState', () => {
  it('returns a string', () => {
    expect(typeof buildEmptyState({})).toBe('string');
  });

  it('gives a generic message when no filters are set', () => {
    const msg = buildEmptyState({});
    expect(msg.toLowerCase()).toContain('no certificates');
  });

  it('mentions the postcode when a valid postcode is given', () => {
    const msg = buildEmptyState({ postcode: 'CV11 6FA' });
    expect(msg).toContain('CV11 6FA');
  });

  it('suggests checking the format when the postcode looks invalid', () => {
    const msg = buildEmptyState({ postcode: 'NOTAPOSTCODE' });
    expect(msg.toLowerCase()).toMatch(/format|check/);
  });

  it('mentions the local authority when one is given', () => {
    const msg = buildEmptyState({ localAuth: 'Westminster' });
    expect(msg).toContain('Westminster');
  });

  it('includes a hint to broaden the search', () => {
    const msg = buildEmptyState({ postcode: 'CV11 6FA' });
    expect(msg.toLowerCase()).toMatch(/broaden|try|nearby/);
  });
});
