import { describe, it, expect } from 'vitest';
import { sortResults, filterByRating, SORT_FIELDS } from '../src/sort-filter.js';

const rows = [
  { 'current-energy-rating': 'D', 'current-energy-efficiency': '66', 'lodgement-date': '2019-07-11', 'total-floor-area': '69.0',  'address1': 'B' },
  { 'current-energy-rating': 'C', 'current-energy-efficiency': '72', 'lodgement-date': '2025-03-10', 'total-floor-area': '62.0',  'address1': 'A' },
  { 'current-energy-rating': 'B', 'current-energy-efficiency': '87', 'lodgement-date': '2021-01-29', 'total-floor-area': '53.0',  'address1': 'C' },
  { 'current-energy-rating': 'D', 'current-energy-efficiency': '65', 'lodgement-date': '2012-03-01', 'total-floor-area': '106.54','address1': 'D' },
  { 'current-energy-rating': 'G', 'current-energy-efficiency': '12', 'lodgement-date': '2010-06-01', 'total-floor-area': '76.31', 'address1': 'E' },
];

// ─── SORT_FIELDS ──────────────────────────────────────────────────────────────

describe('SORT_FIELDS', () => {
  it('includes a field for rating', () => {
    expect(SORT_FIELDS.some(f => f.value === 'current-energy-rating')).toBe(true);
  });

  it('includes a field for score', () => {
    expect(SORT_FIELDS.some(f => f.value === 'current-energy-efficiency')).toBe(true);
  });

  it('includes a field for date lodged', () => {
    expect(SORT_FIELDS.some(f => f.value === 'lodgement-date')).toBe(true);
  });

  it('includes a field for floor area', () => {
    expect(SORT_FIELDS.some(f => f.value === 'total-floor-area')).toBe(true);
  });

  it('every field has a label string', () => {
    SORT_FIELDS.forEach(f => expect(typeof f.label).toBe('string'));
  });
});

// ─── sortResults ──────────────────────────────────────────────────────────────

describe('sortResults', () => {
  it('does not mutate the original array', () => {
    const original = [...rows];
    sortResults(rows, 'current-energy-rating', 'asc');
    expect(rows).toEqual(original);
  });

  it('sorts by rating A→G ascending', () => {
    const sorted = sortResults(rows, 'current-energy-rating', 'asc');
    const ratings = sorted.map(r => r['current-energy-rating']);
    expect(ratings[0]).toBe('B');
    expect(ratings[ratings.length - 1]).toBe('G');
  });

  it('sorts by rating G→A descending', () => {
    const sorted = sortResults(rows, 'current-energy-rating', 'desc');
    expect(sorted[0]['current-energy-rating']).toBe('G');
    expect(sorted[sorted.length - 1]['current-energy-rating']).toBe('B');
  });

  it('sorts by score low→high ascending', () => {
    const sorted = sortResults(rows, 'current-energy-efficiency', 'asc');
    const scores = sorted.map(r => Number(r['current-energy-efficiency']));
    expect(scores[0]).toBe(12);
    expect(scores[scores.length - 1]).toBe(87);
  });

  it('sorts by score high→low descending', () => {
    const sorted = sortResults(rows, 'current-energy-efficiency', 'desc');
    expect(Number(sorted[0]['current-energy-efficiency'])).toBe(87);
  });

  it('sorts by lodgement date oldest first (asc)', () => {
    const sorted = sortResults(rows, 'lodgement-date', 'asc');
    expect(sorted[0]['lodgement-date']).toBe('2010-06-01');
    expect(sorted[sorted.length - 1]['lodgement-date']).toBe('2025-03-10');
  });

  it('sorts by lodgement date newest first (desc)', () => {
    const sorted = sortResults(rows, 'lodgement-date', 'desc');
    expect(sorted[0]['lodgement-date']).toBe('2025-03-10');
  });

  it('sorts by floor area smallest first (asc)', () => {
    const sorted = sortResults(rows, 'total-floor-area', 'asc');
    expect(Number(sorted[0]['total-floor-area'])).toBe(53.0);
  });

  it('sorts by floor area largest first (desc)', () => {
    const sorted = sortResults(rows, 'total-floor-area', 'desc');
    expect(Number(sorted[0]['total-floor-area'])).toBeCloseTo(106.54);
  });

  it('returns a copy of the array unchanged for an unknown field', () => {
    const sorted = sortResults(rows, 'nonexistent', 'asc');
    expect(sorted).toHaveLength(rows.length);
  });

  it('defaults direction to asc when omitted', () => {
    const asc  = sortResults(rows, 'current-energy-efficiency', 'asc');
    const def  = sortResults(rows, 'current-energy-efficiency');
    expect(asc.map(r => r['current-energy-efficiency']))
      .toEqual(def.map(r => r['current-energy-efficiency']));
  });
});

// ─── filterByRating ───────────────────────────────────────────────────────────

describe('filterByRating', () => {
  it('returns all rows when ratings set is empty', () => {
    expect(filterByRating(rows, new Set())).toHaveLength(rows.length);
  });

  it('filters to a single rating', () => {
    const result = filterByRating(rows, new Set(['C']));
    expect(result).toHaveLength(1);
    expect(result[0]['current-energy-rating']).toBe('C');
  });

  it('filters to multiple ratings', () => {
    const result = filterByRating(rows, new Set(['B', 'C']));
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no rows match', () => {
    expect(filterByRating(rows, new Set(['A']))).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const original = [...rows];
    filterByRating(rows, new Set(['D']));
    expect(rows).toEqual(original);
  });
});
