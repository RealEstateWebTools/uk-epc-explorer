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

// Ratings C and D have light backgrounds that fail WCAG contrast with white text
const DARK_TEXT_RATINGS = new Set(['C', 'D']);
export function getRatingTextColor(rating) {
  return DARK_TEXT_RATINGS.has(rating) ? '#1a1a2e' : '#ffffff';
}

const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i;
export function isValidUkPostcode(str) {
  return str ? UK_POSTCODE_RE.test(str.trim()) : false;
}

export function buildEmptyState(filters = {}) {
  const { postcode, localAuth } = filters;

  if (postcode) {
    if (!isValidUkPostcode(postcode)) {
      return `No certificates found. Check the postcode format (e.g. SW1A 1AA).`;
    }
    return `No certificates found for <strong>${postcode}</strong>. This postcode may not have any lodged EPCs — try a nearby postcode or broaden your search.`;
  }

  if (localAuth) {
    return `No certificates found for <strong>${localAuth}</strong>. Try a broader search or check the spelling.`;
  }

  return `No certificates found. Try broadening your search.`;
}
