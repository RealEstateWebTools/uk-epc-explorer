export const RATING_COLORS = {
  A: '#00813d', B: '#1fac28', C: '#8dba11',
  D: '#ffd500', E: '#f4a020', F: '#e55a10', G: '#e01616',
};

export function getRatingColor(rating) {
  return RATING_COLORS[rating] || '#aaa';
}

export function formatDate(str) {
  if (!str) return '–';
  const d = new Date(str);
  return isNaN(d) ? str : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '–';
}
