import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildSearchParams, validateSearch, fetchEpcData, parseApiResponse, fetchCertificate, buildSearchParamsFor, toProxyUrl, fetchWithFallback, fetchCertificateWithFallback } from '../src/api.js';

const PAGE_SIZE = 25;

// ─── validateSearch ──────────────────────────────────────────────────────────

describe('validateSearch', () => {
  it('returns null when postcode is provided', () => {
    expect(validateSearch({ postcode: 'SW1A 1AA', localAuth: '', rating: '' }, { email: 'a@b.com', key: 'k' })).toBeNull();
  });

  it('returns null when localAuth is provided', () => {
    expect(validateSearch({ postcode: '', localAuth: 'Westminster', rating: '' }, { email: 'a@b.com', key: 'k' })).toBeNull();
  });

  it('returns null when rating is provided', () => {
    expect(validateSearch({ postcode: '', localAuth: '', rating: 'A' }, { email: 'a@b.com', key: 'k' })).toBeNull();
  });

  it('returns a message when no search term is given', () => {
    const msg = validateSearch({ postcode: '', localAuth: '', rating: '' }, { email: 'a@b.com', key: 'k' });
    expect(msg).not.toBeNull();
    expect(typeof msg).toBe('string');
  });

  it('returns null when credentials are empty (proxy may handle auth)', () => {
    const msg = validateSearch({ postcode: 'SW1A', localAuth: '', rating: '' }, { email: '', key: '' });
    expect(msg).toBeNull();
  });
});

// ─── buildSearchParams ───────────────────────────────────────────────────────

describe('buildSearchParams', () => {
  it('includes postcode when provided', () => {
    const p = buildSearchParams({ postcode: 'CV11 6FA' }, 1);
    expect(p.get('postcode')).toBe('CV11 6FA');
  });

  it('includes local-authority when provided', () => {
    const p = buildSearchParams({ localAuth: 'Westminster' }, 1);
    expect(p.get('local-authority')).toBe('Westminster');
  });

  it('includes energy-rating when provided', () => {
    const p = buildSearchParams({ rating: 'C' }, 1);
    expect(p.get('energy-rating')).toBe('C');
  });

  it('includes from-year when provided', () => {
    const p = buildSearchParams({ fromYear: '2020' }, 1);
    expect(p.get('from-year')).toBe('2020');
  });

  it('omits postcode when empty', () => {
    const p = buildSearchParams({ postcode: '' }, 1);
    expect(p.has('postcode')).toBe(false);
  });

  it('omits local-authority when empty', () => {
    const p = buildSearchParams({ localAuth: '' }, 1);
    expect(p.has('local-authority')).toBe(false);
  });

  it('omits energy-rating when empty', () => {
    const p = buildSearchParams({ rating: '' }, 1);
    expect(p.has('energy-rating')).toBe(false);
  });

  it('omits from-year when empty', () => {
    const p = buildSearchParams({ fromYear: '' }, 1);
    expect(p.has('from-year')).toBe(false);
  });

  it('includes construction-age-band when ageBand is provided', () => {
    const p = buildSearchParams({ ageBand: 'England and Wales: 1983-1990' }, 1);
    expect(p.get('construction-age-band')).toBe('England and Wales: 1983-1990');
  });

  it('omits construction-age-band when ageBand is empty', () => {
    const p = buildSearchParams({ ageBand: '' }, 1);
    expect(p.has('construction-age-band')).toBe(false);
  });

  it('always includes size = PAGE_SIZE', () => {
    const p = buildSearchParams({}, 1);
    expect(p.get('size')).toBe(String(PAGE_SIZE));
  });

  it('sets from=0 for page 1', () => {
    const p = buildSearchParams({}, 1);
    expect(p.get('from')).toBe('0');
  });

  it('sets from=25 for page 2', () => {
    const p = buildSearchParams({}, 2);
    expect(p.get('from')).toBe('25');
  });

  it('sets from=50 for page 3', () => {
    const p = buildSearchParams({}, 3);
    expect(p.get('from')).toBe('50');
  });

  it('includes all provided fields simultaneously', () => {
    const p = buildSearchParams({ postcode: 'SW1A', localAuth: 'Westminster', rating: 'A', fromYear: '2020' }, 2);
    expect(p.get('postcode')).toBe('SW1A');
    expect(p.get('local-authority')).toBe('Westminster');
    expect(p.get('energy-rating')).toBe('A');
    expect(p.get('from-year')).toBe('2020');
    expect(p.get('from')).toBe('25');
  });
});

// ─── parseApiResponse ────────────────────────────────────────────────────────

describe('parseApiResponse', () => {
  it('returns rows from the response', () => {
    const data = { rows: [{ a: 1 }, { a: 2 }] };
    expect(parseApiResponse(data).rows).toHaveLength(2);
  });

  it('returns an empty array when rows is absent', () => {
    expect(parseApiResponse({}).rows).toEqual([]);
  });

  it('returns an empty array when rows is null', () => {
    expect(parseApiResponse({ rows: null }).rows).toEqual([]);
  });

  it('returns total when present in the response', () => {
    const data = { rows: [], total: 42 };
    expect(parseApiResponse(data).total).toBe(42);
  });

  it('returns null for total when the field is absent (EPC API behaviour)', () => {
    const data = { rows: [] };
    expect(parseApiResponse(data).total).toBeNull();
  });

  it('returns total=0 when total is explicitly 0', () => {
    const data = { rows: [], total: 0 };
    expect(parseApiResponse(data).total).toBe(0);
  });

  it('hasMore is true when rows.length equals PAGE_SIZE', () => {
    const rows = Array(PAGE_SIZE).fill({ a: 1 });
    expect(parseApiResponse({ rows }).hasMore).toBe(true);
  });

  it('hasMore is false when rows.length is less than PAGE_SIZE', () => {
    const rows = Array(PAGE_SIZE - 1).fill({ a: 1 });
    expect(parseApiResponse({ rows }).hasMore).toBe(false);
  });

  it('hasMore is false for an empty result set', () => {
    expect(parseApiResponse({ rows: [] }).hasMore).toBe(false);
  });
});

// ─── fetchEpcData ────────────────────────────────────────────────────────────

describe('fetchEpcData', () => {
  afterEach(() => vi.restoreAllMocks());

  const creds = { email: 'test@example.com', key: 'apikey123' };
  const params = new URLSearchParams({ postcode: 'CV11 6FA', size: '25', from: '0' });
  const okData = { rows: [{ 'current-energy-rating': 'C' }] };

  function mockFetch(status, body) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(body),
    }));
  }

  it('calls the correct EPC API endpoint', async () => {
    mockFetch(200, okData);
    await fetchEpcData(params, creds);
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('epc.opendatacommunities.org/api/v1/domestic/search');
  });

  it('includes the query string in the URL', async () => {
    mockFetch(200, okData);
    await fetchEpcData(params, creds);
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('postcode=CV11+6FA');
  });

  it('sends a Basic Auth header with base64-encoded credentials', async () => {
    mockFetch(200, okData);
    await fetchEpcData(params, creds);
    const { headers } = fetch.mock.calls[0][1];
    const expected = 'Basic ' + btoa('test@example.com:apikey123');
    expect(headers['Authorization']).toBe(expected);
  });

  it('sends Accept: application/json', async () => {
    mockFetch(200, okData);
    await fetchEpcData(params, creds);
    const { headers } = fetch.mock.calls[0][1];
    expect(headers['Accept']).toBe('application/json');
  });

  it('returns parsed JSON data on a 200 response', async () => {
    mockFetch(200, okData);
    const data = await fetchEpcData(params, creds);
    expect(data).toEqual(okData);
  });

  it('throws a friendly error on 401', async () => {
    mockFetch(401, {});
    await expect(fetchEpcData(params, creds)).rejects.toThrow(/credentials/i);
  });

  it('throws an API error message on non-401 failure status', async () => {
    mockFetch(500, {});
    await expect(fetchEpcData(params, creds)).rejects.toThrow(/500/);
  });

  it('throws on a 429 rate-limit response', async () => {
    mockFetch(429, {});
    await expect(fetchEpcData(params, creds)).rejects.toThrow(/429/);
  });

  it('propagates a network error (fetch rejects)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
    await expect(fetchEpcData(params, creds)).rejects.toThrow('Network failure');
  });
});

// ─── fetchCertificate ────────────────────────────────────────────────────────

describe('fetchCertificate', () => {
  afterEach(() => vi.restoreAllMocks());

  const creds = { email: 'test@example.com', key: 'apikey123' };
  const lmkKey = '31d68876c3693c993e2791b05544c569e9bc07916389b667aab0b892f7874550';
  const certData = { rows: [{ 'lmk-key': lmkKey, 'current-energy-rating': 'D' }] };

  function mockFetch(status, body) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(body),
    }));
  }

  it('calls the certificate endpoint with the lmk-key', async () => {
    mockFetch(200, certData);
    await fetchCertificate(lmkKey, creds);
    const url = fetch.mock.calls[0][0];
    expect(url).toContain(`/domestic/certificate/${lmkKey}`);
  });

  it('sends a Basic Auth header', async () => {
    mockFetch(200, certData);
    await fetchCertificate(lmkKey, creds);
    const { headers } = fetch.mock.calls[0][1];
    expect(headers['Authorization']).toBe('Basic ' + btoa('test@example.com:apikey123'));
  });

  it('returns the first row of the response', async () => {
    mockFetch(200, certData);
    const row = await fetchCertificate(lmkKey, creds);
    expect(row['lmk-key']).toBe(lmkKey);
  });

  it('throws a friendly error on 401', async () => {
    mockFetch(401, {});
    await expect(fetchCertificate(lmkKey, creds)).rejects.toThrow(/credentials/i);
  });

  it('throws a not-found error on 404', async () => {
    mockFetch(404, {});
    await expect(fetchCertificate(lmkKey, creds)).rejects.toThrow(/not found/i);
  });

  it('throws an API error on 500', async () => {
    mockFetch(500, {});
    await expect(fetchCertificate(lmkKey, creds)).rejects.toThrow(/500/);
  });

  it('propagates a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));
    await expect(fetchCertificate(lmkKey, creds)).rejects.toThrow('Network failure');
  });

  it('throws if the response rows array is empty', async () => {
    mockFetch(200, { rows: [] });
    await expect(fetchCertificate(lmkKey, creds)).rejects.toThrow(/not found/i);
  });

  it('works with a legacy numeric lmk-key format', async () => {
    const legacyKey = '1071900089432014012214354214278903';
    mockFetch(200, { rows: [{ 'lmk-key': legacyKey }] });
    await fetchCertificate(legacyKey, creds);
    const url = fetch.mock.calls[0][0];
    expect(url).toContain(legacyKey);
  });
});

// ─── toProxyUrl ──────────────────────────────────────────────────────────────

describe('toProxyUrl', () => {
  it('converts a domestic search URL to a proxy path', () => {
    expect(toProxyUrl('https://epc.opendatacommunities.org/api/v1/domestic/search'))
      .toBe('/api/domestic/search');
  });

  it('converts a non-domestic search URL to a proxy path', () => {
    expect(toProxyUrl('https://epc.opendatacommunities.org/api/v1/non-domestic/search'))
      .toBe('/api/non-domestic/search');
  });

  it('converts a certificate URL to a proxy path', () => {
    const lmk = '31d68876c3693c993e2791b05544c569';
    expect(toProxyUrl(`https://epc.opendatacommunities.org/api/v1/domestic/certificate/${lmk}`))
      .toBe(`/api/domestic/certificate/${lmk}`);
  });
});

// ─── fetchWithFallback ────────────────────────────────────────────────────────

describe('fetchWithFallback', () => {
  afterEach(() => vi.restoreAllMocks());

  const creds = { email: 'test@example.com', key: 'apikey123' };
  const noCreds = { email: '', key: '' };
  const params = new URLSearchParams({ postcode: 'CV11 6FA', size: '25', from: '0' });
  const baseUrl = 'https://epc.opendatacommunities.org/api/v1/domestic/search';
  const okData = { rows: [{ 'current-energy-rating': 'C' }] };

  function mockFetch(status, body) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(body),
    }));
  }

  it('returns data from proxy when proxy succeeds (200)', async () => {
    mockFetch(200, okData);
    const data = await fetchWithFallback(params, noCreds, baseUrl);
    expect(data).toEqual(okData);
  });

  it('calls proxy URL (not direct EPC URL) on first attempt', async () => {
    mockFetch(200, okData);
    await fetchWithFallback(params, noCreds, baseUrl);
    const url = fetch.mock.calls[0][0];
    expect(url).toContain('/api/domestic/search');
    expect(url).not.toContain('epc.opendatacommunities.org');
  });

  it('does not send Authorization header in proxy request', async () => {
    mockFetch(200, okData);
    await fetchWithFallback(params, noCreds, baseUrl);
    const { headers } = fetch.mock.calls[0][1];
    expect(headers['Authorization']).toBeUndefined();
  });

  it('falls back to direct when proxy returns 503 and creds are available', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ status: 503, ok: false, statusText: 'Service Unavailable', json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ status: 200, ok: true, statusText: 'OK', json: () => Promise.resolve(okData) })
    );
    const data = await fetchWithFallback(params, creds, baseUrl);
    expect(data).toEqual(okData);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('second call (direct fallback) sends Basic Auth header', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ status: 503, ok: false, statusText: 'Service Unavailable', json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ status: 200, ok: true, statusText: 'OK', json: () => Promise.resolve(okData) })
    );
    await fetchWithFallback(params, creds, baseUrl);
    const { headers } = fetch.mock.calls[1][1];
    expect(headers['Authorization']).toBe('Basic ' + btoa('test@example.com:apikey123'));
  });

  it('falls back to direct when proxy throws a network error and creds are available', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce({ status: 200, ok: true, statusText: 'OK', json: () => Promise.resolve(okData) })
    );
    const data = await fetchWithFallback(params, creds, baseUrl);
    expect(data).toEqual(okData);
  });

  it('throws a helpful error when proxy returns 503 and no creds are available', async () => {
    mockFetch(503, {});
    await expect(fetchWithFallback(params, noCreds, baseUrl)).rejects.toThrow(/credentials/i);
  });

  it('throws a helpful error when proxy throws network error and no creds are available', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchWithFallback(params, noCreds, baseUrl)).rejects.toThrow(/credentials/i);
  });

  it('propagates non-503 errors from proxy immediately (no fallback)', async () => {
    mockFetch(401, {});
    await expect(fetchWithFallback(params, creds, baseUrl)).rejects.toThrow(/credentials/i);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('propagates 500 errors from proxy immediately', async () => {
    mockFetch(500, {});
    await expect(fetchWithFallback(params, creds, baseUrl)).rejects.toThrow(/500/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

// ─── fetchCertificateWithFallback ─────────────────────────────────────────────

describe('fetchCertificateWithFallback', () => {
  afterEach(() => vi.restoreAllMocks());

  const creds = { email: 'test@example.com', key: 'apikey123' };
  const noCreds = { email: '', key: '' };
  const lmkKey = '31d68876c3693c993e2791b05544c569e9bc07916389b667aab0b892f7874550';
  const certData = { rows: [{ 'lmk-key': lmkKey, 'current-energy-rating': 'D' }] };

  function mockFetch(status, body) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(body),
    }));
  }

  it('returns certificate row from proxy when proxy succeeds', async () => {
    mockFetch(200, certData);
    const row = await fetchCertificateWithFallback(lmkKey, noCreds);
    expect(row['lmk-key']).toBe(lmkKey);
  });

  it('calls proxy certificate URL on first attempt', async () => {
    mockFetch(200, certData);
    await fetchCertificateWithFallback(lmkKey, noCreds);
    const url = fetch.mock.calls[0][0];
    expect(url).toContain(`/api/domestic/certificate/${lmkKey}`);
    expect(url).not.toContain('epc.opendatacommunities.org');
  });

  it('falls back to direct when proxy returns 503 and creds are available', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ status: 503, ok: false, statusText: 'Service Unavailable', json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ status: 200, ok: true, statusText: 'OK', json: () => Promise.resolve(certData) })
    );
    const row = await fetchCertificateWithFallback(lmkKey, creds);
    expect(row['lmk-key']).toBe(lmkKey);
  });

  it('throws helpful error when proxy returns 503 and no creds', async () => {
    mockFetch(503, {});
    await expect(fetchCertificateWithFallback(lmkKey, noCreds)).rejects.toThrow(/credentials/i);
  });

  it('throws not-found on 404 from proxy', async () => {
    mockFetch(404, {});
    await expect(fetchCertificateWithFallback(lmkKey, noCreds)).rejects.toThrow(/not found/i);
  });
});

// ─── buildSearchParamsFor (commercial toggle) ─────────────────────────────────

describe('buildSearchParamsFor', () => {
  it('returns domestic API base URL for type "domestic"', () => {
    const { url } = buildSearchParamsFor('domestic', {}, 1);
    expect(url).toContain('/domestic/search');
  });

  it('returns non-domestic API base URL for type "non-domestic"', () => {
    const { url } = buildSearchParamsFor('non-domestic', {}, 1);
    expect(url).toContain('/non-domestic/search');
  });

  it('returns the same params structure as buildSearchParams', () => {
    const filters = { postcode: 'SW1A', rating: 'C' };
    const { params } = buildSearchParamsFor('domestic', filters, 1);
    expect(params.get('postcode')).toBe('SW1A');
    expect(params.get('energy-rating')).toBe('C');
  });

  it('defaults to domestic when type is unrecognised', () => {
    const { url } = buildSearchParamsFor('unknown', {}, 1);
    expect(url).toContain('/domestic/search');
  });
});
