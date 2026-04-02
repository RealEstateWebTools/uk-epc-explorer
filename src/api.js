const PAGE_SIZE = 25;
const API_BASE = 'https://epc.opendatacommunities.org/api/v1/domestic/search';

export function validateSearch(filters, creds) {
  const { postcode, localAuth, rating } = filters;
  if (!postcode && !localAuth && !rating) {
    return 'Please enter at least a postcode, local authority, or rating.';
  }
  if (!creds.email || !creds.key) {
    return 'Please enter your EPC API credentials above.';
  }
  return null;
}

export function buildSearchParams(filters, page) {
  const { postcode = '', localAuth = '', rating = '', fromYear = '' } = filters;
  const params = new URLSearchParams();
  if (postcode) params.set('postcode', postcode);
  if (localAuth) params.set('local-authority', localAuth);
  if (rating) params.set('energy-rating', rating);
  if (fromYear) params.set('from-year', fromYear);
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

export async function fetchEpcData(params, creds) {
  const url = `${API_BASE}?${params}`;
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
