const PAGE_SIZE = 25;
const API_ROOTS = {
  domestic:     'https://epc.opendatacommunities.org/api/v1/domestic',
  'non-domestic': 'https://epc.opendatacommunities.org/api/v1/non-domestic',
};
const API_ROOT = API_ROOTS.domestic;
const API_BASE = `${API_ROOT}/search`;

export function validateSearch(filters) {
  const { postcode, localAuth, rating } = filters;
  if (!postcode && !localAuth && !rating) {
    return 'Please enter at least a postcode, local authority, or rating.';
  }
  return null;
}

const EPC_API_ORIGIN = 'https://epc.opendatacommunities.org/api/v1/';

export function toProxyUrl(epcBaseUrl) {
  const path = epcBaseUrl.replace(EPC_API_ORIGIN, '');
  return `/api/${path}`;
}

export async function fetchWithFallback(params, creds, baseUrl = API_BASE) {
  const proxyUrl = `${toProxyUrl(baseUrl)}?${params}`;
  let proxyFailed = false;

  try {
    const res = await fetch(proxyUrl, { headers: { 'Accept': 'application/json' } });
    if (res.status === 503) {
      proxyFailed = true;
    } else if (res.status === 401) {
      throw new Error('Invalid credentials. Check your email and API key.');
    } else if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    } else {
      return res.json();
    }
  } catch (err) {
    if (err instanceof TypeError) {
      proxyFailed = true;
    } else {
      throw err;
    }
  }

  if (!creds.email || !creds.key) {
    throw new Error('No credentials available. Please enter your EPC API credentials.');
  }
  return fetchEpcData(params, creds, baseUrl);
}

export async function fetchCertificateWithFallback(lmkKey, creds) {
  const proxyUrl = `/api/domestic/certificate/${lmkKey}`;
  let proxyFailed = false;

  try {
    const res = await fetch(proxyUrl, { headers: { 'Accept': 'application/json' } });
    if (res.status === 503) {
      proxyFailed = true;
    } else if (res.status === 401) {
      throw new Error('Invalid credentials. Check your email and API key.');
    } else if (res.status === 404) {
      throw new Error('Certificate not found.');
    } else if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    } else {
      const data = await res.json();
      const rows = data.rows || [];
      if (rows.length === 0) throw new Error('Certificate not found.');
      return rows[0];
    }
  } catch (err) {
    if (err instanceof TypeError) {
      proxyFailed = true;
    } else {
      throw err;
    }
  }

  if (!creds.email || !creds.key) {
    throw new Error('No credentials available. Please enter your EPC API credentials.');
  }
  return fetchCertificate(lmkKey, creds);
}

export function buildSearchParamsFor(type, filters, page) {
  const root = API_ROOTS[type] || API_ROOT;
  return { url: `${root}/search`, params: buildSearchParams(filters, page) };
}

export function buildSearchParams(filters, page) {
  const { postcode = '', localAuth = '', rating = '', fromYear = '', ageBand = '' } = filters;
  const params = new URLSearchParams();
  if (postcode) params.set('postcode', postcode);
  if (localAuth) params.set('local-authority', localAuth);
  if (rating) params.set('energy-rating', rating);
  if (fromYear) params.set('from-year', fromYear);
  if (ageBand) params.set('construction-age-band', ageBand);
  params.set('size', PAGE_SIZE);
  params.set('from', (page - 1) * PAGE_SIZE);
  return params;
}

export function parseApiResponse(data) {
  const rows = data.rows || [];
  const total = data.total != null ? data.total : null;
  const hasMore = rows.length === PAGE_SIZE;
  return { rows, total, hasMore };
}

export async function fetchEpcData(params, creds, baseUrl = API_BASE) {
  const url = `${baseUrl}?${params}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + btoa(`${creds.email}:${creds.key}`),
      'Accept': 'application/json',
    },
  });

  if (res.status === 401) throw new Error('Invalid credentials. Check your email and API key.');
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

  return res.json();
}

export async function fetchCertificate(lmkKey, creds) {
  const url = `${API_ROOT}/certificate/${lmkKey}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + btoa(`${creds.email}:${creds.key}`),
      'Accept': 'application/json',
    },
  });

  if (res.status === 401) throw new Error('Invalid credentials. Check your email and API key.');
  if (res.status === 404) throw new Error('Certificate not found.');
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

  const data = await res.json();
  const rows = data.rows || [];
  if (rows.length === 0) throw new Error('Certificate not found.');
  return rows[0];
}
