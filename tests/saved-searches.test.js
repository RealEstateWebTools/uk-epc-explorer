import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildSearchLabel,
  getSavedSearches,
  saveSearch,
  deleteSavedSearch,
} from '../src/saved-searches.js';

beforeEach(() => {
  localStorage.clear();
});

// ─── buildSearchLabel ─────────────────────────────────────────────────────────

describe('buildSearchLabel', () => {
  it('uses the postcode when only postcode is set', () => {
    expect(buildSearchLabel({ postcode: 'CV11 6FA' })).toBe('CV11 6FA');
  });

  it('uses the local authority when only localAuth is set', () => {
    expect(buildSearchLabel({ localAuth: 'Westminster' })).toBe('Westminster');
  });

  it('appends rating when present', () => {
    expect(buildSearchLabel({ postcode: 'SW1A 1AA', rating: 'D' })).toContain('Rating D');
  });

  it('appends age band when present', () => {
    const label = buildSearchLabel({ localAuth: 'Camden', ageBand: 'England and Wales: 1983-1990' });
    expect(label).toContain('1983-1990');
  });

  it('appends from-year when present', () => {
    const label = buildSearchLabel({ postcode: 'SW1A', fromYear: '2015' });
    expect(label).toContain('2015');
  });

  it('combines postcode and local authority', () => {
    const label = buildSearchLabel({ postcode: 'SW1A', localAuth: 'Westminster' });
    expect(label).toContain('SW1A');
    expect(label).toContain('Westminster');
  });

  it('returns a fallback string when no filters are set', () => {
    expect(typeof buildSearchLabel({})).toBe('string');
    expect(buildSearchLabel({}).length).toBeGreaterThan(0);
  });
});

// ─── getSavedSearches ─────────────────────────────────────────────────────────

describe('getSavedSearches', () => {
  it('returns an empty array when nothing is saved', () => {
    expect(getSavedSearches()).toEqual([]);
  });

  it('returns saved searches after saving', () => {
    saveSearch({ postcode: 'CV11 6FA' });
    expect(getSavedSearches()).toHaveLength(1);
  });

  it('returns an array of objects with id, label, filters, and savedAt', () => {
    saveSearch({ postcode: 'CV11 6FA' });
    const [entry] = getSavedSearches();
    expect(entry).toHaveProperty('id');
    expect(entry).toHaveProperty('label');
    expect(entry).toHaveProperty('filters');
    expect(entry).toHaveProperty('savedAt');
  });

  it('persists the filters correctly', () => {
    const filters = { postcode: 'CV11 6FA', rating: 'D', localAuth: '', fromYear: '', ageBand: '' };
    saveSearch(filters);
    expect(getSavedSearches()[0].filters).toMatchObject({ postcode: 'CV11 6FA', rating: 'D' });
  });
});

// ─── saveSearch ───────────────────────────────────────────────────────────────

describe('saveSearch', () => {
  it('returns the new entry', () => {
    const entry = saveSearch({ postcode: 'SW1A 1AA' });
    expect(entry).toHaveProperty('id');
    expect(entry.filters.postcode).toBe('SW1A 1AA');
  });

  it('accumulates multiple saves', () => {
    saveSearch({ postcode: 'SW1A 1AA' });
    saveSearch({ localAuth: 'Westminster' });
    expect(getSavedSearches()).toHaveLength(2);
  });

  it('each entry gets a unique id', () => {
    const a = saveSearch({ postcode: 'SW1A' });
    const b = saveSearch({ postcode: 'CV11' });
    expect(a.id).not.toBe(b.id);
  });

  it('does not save a duplicate of the most recent identical search', () => {
    saveSearch({ postcode: 'CV11 6FA', rating: '', localAuth: '', fromYear: '', ageBand: '' });
    saveSearch({ postcode: 'CV11 6FA', rating: '', localAuth: '', fromYear: '', ageBand: '' });
    expect(getSavedSearches()).toHaveLength(1);
  });

  it('does save when filters differ from the most recent', () => {
    saveSearch({ postcode: 'CV11 6FA', rating: '', localAuth: '', fromYear: '', ageBand: '' });
    saveSearch({ postcode: 'CV11 6FA', rating: 'D', localAuth: '', fromYear: '', ageBand: '' });
    expect(getSavedSearches()).toHaveLength(2);
  });
});

// ─── deleteSavedSearch ────────────────────────────────────────────────────────

describe('deleteSavedSearch', () => {
  it('removes the entry with the given id', () => {
    const entry = saveSearch({ postcode: 'SW1A 1AA' });
    deleteSavedSearch(entry.id);
    expect(getSavedSearches()).toHaveLength(0);
  });

  it('leaves other entries intact', () => {
    saveSearch({ postcode: 'SW1A 1AA' });
    const b = saveSearch({ localAuth: 'Westminster' });
    deleteSavedSearch(b.id);
    expect(getSavedSearches()).toHaveLength(1);
    expect(getSavedSearches()[0].filters.postcode).toBe('SW1A 1AA');
  });

  it('is a no-op for an unknown id', () => {
    saveSearch({ postcode: 'SW1A' });
    deleteSavedSearch('nonexistent-id');
    expect(getSavedSearches()).toHaveLength(1);
  });
});
