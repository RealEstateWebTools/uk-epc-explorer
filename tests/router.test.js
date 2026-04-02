import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseRoute, navigate } from '../src/router.js';

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
});
