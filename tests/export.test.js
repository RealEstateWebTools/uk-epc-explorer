import { describe, it, expect } from 'vitest';
import { toCsv, CSV_COLUMNS } from '../src/export.js';

const row = {
  'lmk-key': 'abc123',
  'address1': '16 Sidmouth Close',
  'address2': '',
  'address3': '',
  'postcode': 'CV11 6FA',
  'property-type': 'House',
  'built-form': 'Semi-Detached',
  'current-energy-rating': 'D',
  'current-energy-efficiency': '66',
  'potential-energy-rating': 'B',
  'potential-energy-efficiency': '87',
  'inspection-date': '2025-04-28',
  'lodgement-date': '2025-04-28',
  'tenure': 'Owner-occupied',
  'total-floor-area': '78.0',
  'co2-emissions-current': '3.4',
  'heating-cost-current': '718',
  'hot-water-cost-current': '264',
  'lighting-cost-current': '83',
  'transaction-type': 'marketed sale',
  'local-authority-label': 'Nuneaton and Bedworth',
};

// ─── CSV_COLUMNS ──────────────────────────────────────────────────────────────

describe('CSV_COLUMNS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(CSV_COLUMNS)).toBe(true);
    expect(CSV_COLUMNS.length).toBeGreaterThan(0);
  });

  it('every column has a key and a label', () => {
    CSV_COLUMNS.forEach(col => {
      expect(typeof col.key).toBe('string');
      expect(typeof col.label).toBe('string');
    });
  });

  it('includes address, rating, score, postcode, and lmk-key', () => {
    const keys = CSV_COLUMNS.map(c => c.key);
    expect(keys).toContain('address1');
    expect(keys).toContain('postcode');
    expect(keys).toContain('current-energy-rating');
    expect(keys).toContain('current-energy-efficiency');
    expect(keys).toContain('lmk-key');
  });
});

// ─── toCsv ────────────────────────────────────────────────────────────────────

describe('toCsv', () => {
  it('returns a string', () => {
    expect(typeof toCsv([row])).toBe('string');
  });

  it('first line is the header row', () => {
    const csv = toCsv([row]);
    const header = csv.split('\n')[0];
    CSV_COLUMNS.forEach(col => expect(header).toContain(col.label));
  });

  it('second line contains the row data', () => {
    const csv = toCsv([row]);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toContain('CV11 6FA');
    expect(dataLine).toContain('D');
    expect(dataLine).toContain('66');
  });

  it('produces one data line per row', () => {
    const csv = toCsv([row, row, row]);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(4); // 1 header + 3 data
  });

  it('wraps values containing commas in double quotes', () => {
    const r = { ...row, 'address1': '16, Sidmouth Close' };
    const csv = toCsv([r]);
    expect(csv).toContain('"16, Sidmouth Close"');
  });

  it('escapes double quotes inside values by doubling them', () => {
    const r = { ...row, 'address1': 'Flat "A"' };
    const csv = toCsv([r]);
    expect(csv).toContain('"Flat ""A"""');
  });

  it('wraps values containing newlines in double quotes', () => {
    const r = { ...row, 'address1': 'Line1\nLine2' };
    const csv = toCsv([r]);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toContain('"Line1');
  });

  it('outputs empty string for missing fields', () => {
    const csv = toCsv([{}]);
    const dataLine = csv.split('\n')[1];
    // Should be all commas, no real values
    expect(dataLine.replace(/,/g, '').trim()).toBe('');
  });

  it('returns just the header for an empty rows array', () => {
    const csv = toCsv([]);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(1);
  });
});
