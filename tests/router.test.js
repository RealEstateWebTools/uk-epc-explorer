import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseRoute, navigate, parseSearchFilters, buildSearchUrl } from '../src/router.js';

// ─── parseRoute ───────────────────────────────────────────────────────────────

describe('parseRoute', () => {
  it('returns search view for "/"', () => {
    expect(parseRoute('/')).toEqual({ view: 'search' });
  });

  it('returns search view for empty string', () => {
    expect(parseRoute('')).toEqual({ view: 'search' });
  });

  it('returns detail view for "/certificate/:lmkKey"', () => {
    expect(parseRoute('/certificate/abc123')).toEqual({ view: 'detail', lmkKey: 'abc123' });
  });

  it('captures a long hex lmk-key', () => {
    const key = '31d68876c3693c993e2791b05544c569e9bc07916389b667aab0b892f7874550';
    expect(parseRoute(`/certificate/${key}`)).toEqual({ view: 'detail', lmkKey: key });
  });

  it('captures a numeric legacy lmk-key', () => {
    const key = '1071900089432014012214354214278903';
    expect(parseRoute(`/certificate/${key}`)).toEqual({ view: 'detail', lmkKey: key });
  });

  it('returns notfound for "/certificate/" with no key', () => {
    expect(parseRoute('/certificate/')).toEqual({ view: 'notfound' });
  });

  it('returns notfound for "/certificate" with no trailing slash', () => {
    expect(parseRoute('/certificate')).toEqual({ view: 'notfound' });
  });

  it('returns notfound for an unknown path', () => {
    expect(parseRoute('/about')).toEqual({ view: 'notfound' });
  });

  it('returns notfound for a deeply nested unknown path', () => {
    expect(parseRoute('/foo/bar/baz')).toEqual({ view: 'notfound' });
  });
});

// ─── navigate ─────────────────────────────────────────────────────────────────

describe('navigate', () => {
  beforeEach(() => {
    // Reset location to '/' before each test
    history.pushState(null, '', '/');
  });

  it('updates window.location.pathname', () => {
    navigate('/certificate/abc123');
    expect(window.location.pathname).toBe('/certificate/abc123');
  });

  it('dispatches a popstate event so listeners re-render', () => {
    const handler = vi.fn();
    window.addEventListener('popstate', handler);
    navigate('/certificate/abc123');
    expect(handler).toHaveBeenCalledOnce();
    window.removeEventListener('popstate', handler);
  });

  it('navigates back to "/"', () => {
    navigate('/certificate/abc123');
    navigate('/');
    expect(window.location.pathname).toBe('/');
  });

  it('preserves query string in the URL', () => {
    navigate('/?postcode=CV11+6FA&rating=D');
    expect(window.location.search).toBe('?postcode=CV11+6FA&rating=D');
  });
});

// ─── parseSearchFilters ───────────────────────────────────────────────────────

describe('parseSearchFilters', () => {
  it('returns all-empty defaults for an empty query string', () => {
    expect(parseSearchFilters('')).toEqual({ postcode: '', localAuth: '', rating: '', fromYear: '', ageBand: '', page: 1 });
  });

  it('extracts postcode', () => {
    expect(parseSearchFilters('?postcode=CV11+6FA').postcode).toBe('CV11 6FA');
  });

  it('extracts local-authority into localAuth', () => {
    expect(parseSearchFilters('?local-authority=Westminster').localAuth).toBe('Westminster');
  });

  it('extracts rating', () => {
    expect(parseSearchFilters('?rating=D').rating).toBe('D');
  });

  it('extracts from-year into fromYear', () => {
    expect(parseSearchFilters('?from-year=2020').fromYear).toBe('2020');
  });

  it('extracts page as an integer', () => {
    expect(parseSearchFilters('?page=3').page).toBe(3);
  });

  it('defaults page to 1 when absent', () => {
    expect(parseSearchFilters('?postcode=SW1A').page).toBe(1);
  });

  it('defaults page to 1 for a non-numeric page value', () => {
    expect(parseSearchFilters('?page=abc').page).toBe(1);
  });

  it('defaults page to 1 for page=0', () => {
    expect(parseSearchFilters('?page=0').page).toBe(1);
  });

  it('extracts all filters simultaneously', () => {
    const qs = '?postcode=SW1A&local-authority=Westminster&rating=A&from-year=2020&page=2';
    expect(parseSearchFilters(qs)).toEqual({
      postcode: 'SW1A',
      localAuth: 'Westminster',
      rating: 'A',
      fromYear: '2020',
      ageBand: '',
      page: 2,
    });
  });

  it('handles a query string without the leading "?"', () => {
    expect(parseSearchFilters('postcode=SW1A').postcode).toBe('SW1A');
  });
});

// ─── buildSearchUrl ───────────────────────────────────────────────────────────

describe('buildSearchUrl', () => {
  it('returns "/" when no filters are set and page is 1', () => {
    expect(buildSearchUrl({ postcode: '', localAuth: '', rating: '', fromYear: '' }, 1)).toBe('/');
  });

  it('includes postcode in the query string', () => {
    expect(buildSearchUrl({ postcode: 'CV11 6FA', localAuth: '', rating: '', fromYear: '' }, 1))
      .toContain('postcode=CV11+6FA');
  });

  it('includes local-authority in the query string', () => {
    expect(buildSearchUrl({ postcode: '', localAuth: 'Westminster', rating: '', fromYear: '' }, 1))
      .toContain('local-authority=Westminster');
  });

  it('includes rating in the query string', () => {
    expect(buildSearchUrl({ postcode: '', localAuth: '', rating: 'D', fromYear: '' }, 1))
      .toContain('rating=D');
  });

  it('includes from-year in the query string', () => {
    expect(buildSearchUrl({ postcode: '', localAuth: '', rating: '', fromYear: '2020' }, 1))
      .toContain('from-year=2020');
  });

  it('omits page param on page 1', () => {
    const url = buildSearchUrl({ postcode: 'SW1A', localAuth: '', rating: '', fromYear: '' }, 1);
    expect(url).not.toContain('page=');
  });

  it('includes page param on page 2+', () => {
    const url = buildSearchUrl({ postcode: 'SW1A', localAuth: '', rating: '', fromYear: '' }, 2);
    expect(url).toContain('page=2');
  });

  it('omits empty filters from the query string', () => {
    const url = buildSearchUrl({ postcode: 'SW1A', localAuth: '', rating: '', fromYear: '' }, 1);
    expect(url).not.toContain('local-authority');
    expect(url).not.toContain('rating');
    expect(url).not.toContain('from-year');
  });

  it('builds a URL starting with "/"', () => {
    expect(buildSearchUrl({ postcode: 'SW1A', localAuth: '', rating: '', fromYear: '' }, 1))
      .toMatch(/^\//);
  });

  it('includes all filters when all are set', () => {
    const url = buildSearchUrl({ postcode: 'SW1A', localAuth: 'Westminster', rating: 'A', fromYear: '2020' }, 3);
    expect(url).toContain('postcode=SW1A');
    expect(url).toContain('local-authority=Westminster');
    expect(url).toContain('rating=A');
    expect(url).toContain('from-year=2020');
    expect(url).toContain('page=3');
  });

  it('includes age-band in the query string when set', () => {
    const url = buildSearchUrl({ postcode: '', localAuth: '', rating: '', fromYear: '', ageBand: '1983-1990' }, 1);
    expect(url).toContain('age-band=1983-1990');
  });

  it('omits age-band when empty', () => {
    const url = buildSearchUrl({ postcode: 'SW1A', localAuth: '', rating: '', fromYear: '', ageBand: '' }, 1);
    expect(url).not.toContain('age-band');
  });
});

// ─── parseSearchFilters (age band) ───────────────────────────────────────────

describe('parseSearchFilters age band', () => {
  it('extracts age-band into ageBand', () => {
    expect(parseSearchFilters('?age-band=1983-1990').ageBand).toBe('1983-1990');
  });

  it('defaults ageBand to empty string when absent', () => {
    expect(parseSearchFilters('?postcode=SW1A').ageBand).toBe('');
  });
});
