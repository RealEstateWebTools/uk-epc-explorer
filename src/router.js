export function parseRoute(pathname) {
  if (!pathname || pathname === '/') return { view: 'search' };

  const match = pathname.match(/^\/certificate\/(.+)$/);
  if (match) return { view: 'detail', lmkKey: match[1] };

  return { view: 'notfound' };
}

export function parseSearchFilters(searchStr) {
  const params = new URLSearchParams(searchStr);
  const page = parseInt(params.get('page') || '1', 10);
  return {
    postcode:  params.get('postcode')        || '',
    localAuth: params.get('local-authority') || '',
    rating:    params.get('rating')          || '',
    fromYear:  params.get('from-year')       || '',
    page:      page >= 1 ? page : 1,
  };
}

export function buildSearchUrl(filters, page) {
  const params = new URLSearchParams();
  if (filters.postcode)  params.set('postcode',        filters.postcode);
  if (filters.localAuth) params.set('local-authority', filters.localAuth);
  if (filters.rating)    params.set('rating',          filters.rating);
  if (filters.fromYear)  params.set('from-year',       filters.fromYear);
  if (page > 1)          params.set('page',            page);
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

export function navigate(path) {
  history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
