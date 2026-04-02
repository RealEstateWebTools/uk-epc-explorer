export function parseRoute(pathname) {
  if (!pathname || pathname === '/') return { view: 'search' };

  const match = pathname.match(/^\/certificate\/(.+)$/);
  if (match) return { view: 'detail', lmkKey: match[1] };

  return { view: 'notfound' };
}

export function navigate(path) {
  history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
