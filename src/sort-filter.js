export const SORT_FIELDS = [
  { value: 'current-energy-rating',    label: 'Rating' },
  { value: 'current-energy-efficiency', label: 'Score' },
  { value: 'lodgement-date',            label: 'Date lodged' },
  { value: 'total-floor-area',          label: 'Floor area' },
];

const RATING_ORDER = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7 };

export function sortResults(rows, field, dir = 'asc') {
  const copy = [...rows];
  const sign = dir === 'desc' ? -1 : 1;

  copy.sort((a, b) => {
    const av = a[field];
    const bv = b[field];

    if (av === undefined && bv === undefined) return 0;
    if (av === undefined) return 1;
    if (bv === undefined) return -1;

    if (field === 'current-energy-rating') {
      return sign * ((RATING_ORDER[av] || 99) - (RATING_ORDER[bv] || 99));
    }

    if (field === 'lodgement-date' || field === 'inspection-date') {
      return sign * (new Date(av) - new Date(bv));
    }

    const an = parseFloat(av);
    const bn = parseFloat(bv);
    if (!isNaN(an) && !isNaN(bn)) return sign * (an - bn);

    return sign * String(av).localeCompare(String(bv));
  });

  return copy;
}

export function filterByRating(rows, ratings) {
  if (!ratings || ratings.size === 0) return [...rows];
  return rows.filter(r => ratings.has(r['current-energy-rating']));
}
