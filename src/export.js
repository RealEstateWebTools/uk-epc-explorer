export const CSV_COLUMNS = [
  { key: 'lmk-key',                    label: 'LMK Key' },
  { key: 'address1',                   label: 'Address 1' },
  { key: 'address2',                   label: 'Address 2' },
  { key: 'postcode',                   label: 'Postcode' },
  { key: 'local-authority-label',      label: 'Local Authority' },
  { key: 'property-type',              label: 'Property Type' },
  { key: 'built-form',                 label: 'Built Form' },
  { key: 'construction-age-band',      label: 'Age Band' },
  { key: 'tenure',                     label: 'Tenure' },
  { key: 'transaction-type',           label: 'Transaction Type' },
  { key: 'total-floor-area',           label: 'Floor Area (m²)' },
  { key: 'current-energy-rating',      label: 'Current Rating' },
  { key: 'current-energy-efficiency',  label: 'Current Score' },
  { key: 'potential-energy-rating',    label: 'Potential Rating' },
  { key: 'potential-energy-efficiency',label: 'Potential Score' },
  { key: 'co2-emissions-current',      label: 'CO₂ Current (t/yr)' },
  { key: 'co2-emissions-potential',    label: 'CO₂ Potential (t/yr)' },
  { key: 'heating-cost-current',       label: 'Heating Cost Current (£)' },
  { key: 'heating-cost-potential',     label: 'Heating Cost Potential (£)' },
  { key: 'hot-water-cost-current',     label: 'Hot Water Cost Current (£)' },
  { key: 'hot-water-cost-potential',   label: 'Hot Water Cost Potential (£)' },
  { key: 'lighting-cost-current',      label: 'Lighting Cost Current (£)' },
  { key: 'lighting-cost-potential',    label: 'Lighting Cost Potential (£)' },
  { key: 'inspection-date',            label: 'Inspection Date' },
  { key: 'lodgement-date',             label: 'Lodgement Date' },
  { key: 'uprn',                       label: 'UPRN' },
];

function csvCell(value) {
  const str = value !== null && value !== undefined ? String(value) : '';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function toCsv(rows) {
  const header = CSV_COLUMNS.map(c => c.label).join(',');
  const lines = rows.map(row =>
    CSV_COLUMNS.map(c => csvCell(row[c.key])).join(',')
  );
  return [header, ...lines].join('\n');
}

export function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
