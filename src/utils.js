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

const CERTIFICATE_VALIDITY_YEARS = 10;
const EXPIRY_WARNING_DAYS = 365;

export function getExpiryStatus(lodgementDate, today = new Date()) {
  if (!lodgementDate) return { status: 'expired', daysRemaining: 0 };
  const lodged = new Date(lodgementDate);
  const expiry = new Date(lodged);
  expiry.setFullYear(expiry.getFullYear() + CERTIFICATE_VALIDITY_YEARS);
  const msRemaining = expiry - today;
  const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
  if (daysRemaining <= 0) return { status: 'expired', daysRemaining, expiry };
  if (daysRemaining < EXPIRY_WARNING_DAYS) return { status: 'expiring-soon', daysRemaining, expiry };
  return { status: 'valid', daysRemaining, expiry };
}

const RATING_BANDS = {
  A: { min: 92, max: 100, description: 'Very energy efficient' },
  B: { min: 81, max: 91,  description: 'Energy efficient' },
  C: { min: 69, max: 80,  description: 'Fairly energy efficient' },
  D: { min: 55, max: 68,  description: 'Below average efficiency' },
  E: { min: 39, max: 54,  description: 'Poor efficiency' },
  F: { min: 21, max: 38,  description: 'Very poor efficiency' },
  G: { min: 1,  max: 20,  description: 'Extremely poor efficiency' },
};

export function getRatingBandInfo(rating) {
  return RATING_BANDS[rating] || null;
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
