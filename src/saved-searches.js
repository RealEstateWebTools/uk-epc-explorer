const STORAGE_KEY = 'epc_saved_searches';

export function buildSearchLabel(filters = {}) {
  const parts = [];
  if (filters.postcode)  parts.push(filters.postcode);
  if (filters.localAuth) parts.push(filters.localAuth);
  if (filters.rating)    parts.push(`Rating ${filters.rating}`);
  if (filters.ageBand)   parts.push(filters.ageBand.replace(/^England and Wales:\s*/i, ''));
  if (filters.fromYear)  parts.push(`from ${filters.fromYear}`);
  return parts.length ? parts.join(' · ') : 'All properties';
}

export function getSavedSearches() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveSearch(filters) {
  const searches = getSavedSearches();
  const last = searches[searches.length - 1];
  if (last && JSON.stringify(last.filters) === JSON.stringify(filters)) {
    return last;
  }
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: buildSearchLabel(filters),
    filters,
    savedAt: new Date().toISOString(),
  };
  searches.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  return entry;
}

export function deleteSavedSearch(id) {
  const searches = getSavedSearches().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}
