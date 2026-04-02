import { getRatingColor, getRatingTextColor, formatDate } from './utils.js';

const REGISTER_SEARCH = 'https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode';

function buildExternalLinks(row) {
  const postcode = (row['postcode'] || '').trim();
  const uprn = (row['uprn'] || '').trim();
  const address = [row['address1'], row['address2'], row['address3']].filter(Boolean).join(' ');
  const q = encodeURIComponent(`${address} ${postcode}`.trim());
  const pc = encodeURIComponent(postcode);

  const links = [];

  if (postcode) {
    links.push(
      { label: 'Flood risk',        href: `https://check-long-term-flood-risk.service.gov.uk/postcode?postcode=${pc}` },
      { label: 'Rightmove prices',  href: `https://www.rightmove.co.uk/house-prices/${pc}.html` },
      { label: 'Zoopla prices',     href: `https://www.zoopla.co.uk/house-prices/${pc}/` },
      { label: 'Broadband (Ofcom)', href: `https://checker.ofcom.org.uk/en-gb/broadband-coverage?postcode=${pc}` },
      { label: 'Crime stats',       href: `https://www.police.uk/pu/your-area/your-neighbourhood/?q=${pc}` },
      { label: 'Schools nearby',    href: `https://www.compare-school-performance.service.gov.uk/schools-by-type?postcode=${pc}` },
    );
  }
  if (uprn) {
    links.push({ label: 'UPRN lookup', href: `https://uprn.uk/${uprn}` });
  }
  if (q) {
    links.push(
      { label: 'Street View',  href: `https://maps.google.com/?q=${q}&layer=c` },
      { label: 'Google Maps',  href: `https://maps.google.com/?q=${q}` },
    );
  }

  if (!links.length) return null;

  const section = document.createElement('div');
  section.className = 'related-links';
  section.innerHTML = '<h3 class="related-links-title">Related Links</h3>';
  const list = document.createElement('div');
  list.className = 'related-links-list';
  links.forEach(({ label, href }) => {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'related-link';
    a.textContent = `${label} ↗`;
    list.appendChild(a);
  });
  section.appendChild(list);
  return section;
}

const EFF_COLORS = {
  'Very Good': '#00813d',
  'Good':      '#1fac28',
  'Average':   '#ffd500',
  'Poor':      '#f4a020',
  'Very Poor': '#e01616',
};

export function efficiencyColor(rating) {
  return EFF_COLORS[rating] || '#ccc';
}

export function buildRatingBar(rating, score) {
  const color = getRatingColor(rating);
  const textColor = getRatingTextColor(rating);
  const el = document.createElement('div');
  el.className = 'rating-bar';
  el.style.setProperty('--rating-color', color);
  el.innerHTML = `
    <div class="rating-bar-label">
      <span class="rating-letter" style="background:${color};color:${textColor}" aria-label="EPC rating: ${rating}">${rating}</span>
      <span class="rating-score">${score || 0} / 100</span>
    </div>
    <div class="rating-bar-track">
      <div class="rating-bar-fill" style="width:${score || 0}%;background:${color}"></div>
    </div>
  `;
  return el;
}

export function buildSectionCard(title, items) {
  const card = document.createElement('div');
  card.className = 'detail-card';
  const rows = items.map(({ label, value, color }) => {
    const display = value !== null && value !== undefined && value !== '' ? value : '–';
    const dot = color
      ? `<span class="eff-dot" style="background:${color}"></span>`
      : '';
    return `
      <div class="detail-row">
        <span class="detail-label">${label}</span>
        <span class="detail-value">${dot}${display}</span>
      </div>`;
  }).join('');
  card.innerHTML = `<h3 class="detail-card-title">${title}</h3>${rows}`;
  return card;
}

export function buildCostRow(label, current, potential) {
  const hasBoth = current != null && potential != null;
  const saving = hasBoth ? Math.round(Number(current) - Number(potential)) : null;
  const savingClass = saving > 0 ? ' saving-positive' : '';

  const fmt = (v) => v != null ? `£${Math.round(v)}` : '–';
  const savingText = saving != null ? `£${Math.abs(saving)}` : '–';

  const el = document.createElement('div');
  el.className = 'cost-row';
  el.innerHTML = `
    <span class="cost-label">${label}</span>
    <span class="cost-current">${fmt(current)}</span>
    <span class="cost-potential">${fmt(potential)}</span>
    <span class="cost-saving${savingClass}">${savingText}</span>
  `;
  return el;
}

export function buildDetailPage(row) {
  const address = [row['address1'], row['address2'], row['address3']].filter(Boolean).join(', ');
  const postcode = row['postcode'] || '';
  const lmkKey = row['lmk-key'] || '';
  const curRating = row['current-energy-rating'] || '?';
  const potRating = row['potential-energy-rating'] || '?';
  const curScore = parseInt(row['current-energy-efficiency'] || 0);
  const potScore = parseInt(row['potential-energy-efficiency'] || 0);

  const page = document.createElement('div');
  page.className = 'detail-page';

  // ── Back link ──────────────────────────────────────────────────────────────
  const back = document.createElement('a');
  back.href = '/';
  back.className = 'back-link';
  back.textContent = '← Back to results';
  page.appendChild(back);

  // ── Header ─────────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'detail-header';
  header.innerHTML = `
    <div class="detail-address">
      <div class="detail-address-main">${address || '(no address)'}</div>
      <div class="detail-address-postcode">${postcode}</div>
      ${row['local-authority-label'] ? `<div class="detail-authority">${row['local-authority-label']}</div>` : ''}
    </div>
  `;

  const ratings = document.createElement('div');
  ratings.className = 'detail-ratings';

  const curCol = document.createElement('div');
  curCol.className = 'detail-rating-col';
  curCol.innerHTML = '<div class="detail-rating-label">Current</div>';
  curCol.appendChild(buildRatingBar(curRating, curScore));

  const potCol = document.createElement('div');
  potCol.className = 'detail-rating-col';
  potCol.innerHTML = '<div class="detail-rating-label">Potential</div>';
  potCol.appendChild(buildRatingBar(potRating, potScore));

  ratings.appendChild(curCol);
  ratings.appendChild(potCol);
  header.appendChild(ratings);
  page.appendChild(header);

  // ── Grid ───────────────────────────────────────────────────────────────────
  const grid = document.createElement('div');
  grid.className = 'detail-grid';

  // Certificate info
  const certCard = buildSectionCard('Certificate', [
    { label: 'LMK Key',          value: lmkKey ? lmkKey.slice(0, 16) + '…' : '–' },
    { label: 'UPRN',             value: row['uprn'] },
    { label: 'Inspected',        value: formatDate(row['inspection-date']) },
    { label: 'Lodged',           value: formatDate(row['lodgement-date']) },
    { label: 'Transaction type', value: row['transaction-type'] },
    { label: 'Tenure',           value: row['tenure'] },
    { label: 'Report type',      value: row['report-type'] },
  ]);
  if (postcode) {
    const link = document.createElement('a');
    link.href = `${REGISTER_SEARCH}?postcode=${encodeURIComponent(postcode)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'register-link';
    link.textContent = 'Search this postcode on EPC Register ↗';
    certCard.appendChild(link);
  }
  grid.appendChild(certCard);

  // Property details
  grid.appendChild(buildSectionCard('Property', [
    { label: 'Type',              value: [row['property-type'], row['built-form']].filter(Boolean).join(' · ') },
    { label: 'Age band',          value: row['construction-age-band'] },
    { label: 'Floor area',        value: row['total-floor-area'] ? `${row['total-floor-area']} m²` : null },
    { label: 'Floor height',      value: row['floor-height'] ? `${row['floor-height']} m` : null },
    { label: 'Habitable rooms',   value: row['number-habitable-rooms'] },
    { label: 'Heated rooms',      value: row['number-heated-rooms'] },
    { label: 'Mains gas',         value: row['mains-gas-flag'] === 'Y' ? 'Yes' : row['mains-gas-flag'] === 'N' ? 'No' : null },
    { label: 'Solar water heat',  value: row['solar-water-heating-flag'] === 'Y' ? 'Yes' : row['solar-water-heating-flag'] === 'N' ? 'No' : null },
  ]));

  // Running costs
  const costsCard = document.createElement('div');
  costsCard.className = 'detail-card';
  costsCard.innerHTML = `
    <h3 class="detail-card-title">Running Costs</h3>
    <div class="cost-header">
      <span></span>
      <span class="cost-col-head">Current</span>
      <span class="cost-col-head">Potential</span>
      <span class="cost-col-head">Saving</span>
    </div>
  `;
  costsCard.appendChild(buildCostRow('Heating',   row['heating-cost-current'],    row['heating-cost-potential']));
  costsCard.appendChild(buildCostRow('Hot water', row['hot-water-cost-current'],  row['hot-water-cost-potential']));
  costsCard.appendChild(buildCostRow('Lighting',  row['lighting-cost-current'],   row['lighting-cost-potential']));

  const hc = Number(row['heating-cost-current'] || 0);
  const hwc = Number(row['hot-water-cost-current'] || 0);
  const lc = Number(row['lighting-cost-current'] || 0);
  const hp = Number(row['heating-cost-potential'] || 0);
  const hwp = Number(row['hot-water-cost-potential'] || 0);
  const lp = Number(row['lighting-cost-potential'] || 0);
  costsCard.appendChild(buildCostRow('Total', hc + hwc + lc || null, hp + hwp + lp || null));
  grid.appendChild(costsCard);

  // CO2 & Energy
  grid.appendChild(buildSectionCard('CO₂ & Energy', [
    { label: 'CO₂ (current)',          value: row['co2-emissions-current'] ? `${row['co2-emissions-current']} t/yr` : null },
    { label: 'CO₂ (potential)',         value: row['co2-emissions-potential'] ? `${row['co2-emissions-potential']} t/yr` : null },
    { label: 'CO₂ per m² (current)',   value: row['co2-emiss-curr-per-floor-area'] ? `${row['co2-emiss-curr-per-floor-area']} kg/m²` : null },
    { label: 'Energy use (current)',    value: row['energy-consumption-current'] ? `${row['energy-consumption-current']} kWh/m²/yr` : null },
    { label: 'Energy use (potential)',  value: row['energy-consumption-potential'] ? `${row['energy-consumption-potential']} kWh/m²/yr` : null },
    { label: 'Env. impact (current)',   value: row['environment-impact-current'] },
    { label: 'Env. impact (potential)', value: row['environment-impact-potential'] },
  ]));

  // Building fabric
  grid.appendChild(buildSectionCard('Building Fabric', [
    { label: 'Walls',   value: row['walls-description'],   color: efficiencyColor(row['walls-energy-eff']) },
    { label: 'Roof',    value: row['roof-description'],    color: efficiencyColor(row['roof-energy-eff']) },
    { label: 'Floor',   value: row['floor-description'],   color: efficiencyColor(row['floor-energy-eff']) },
    { label: 'Windows', value: row['windows-description'], color: efficiencyColor(row['windows-energy-eff']) },
  ]));

  // Heating & Hot water
  grid.appendChild(buildSectionCard('Heating & Hot Water', [
    { label: 'Main heat',     value: row['mainheat-description'],     color: efficiencyColor(row['mainheat-energy-eff']) },
    { label: 'Heat controls', value: row['mainheatcont-description'], color: efficiencyColor(row['mainheatc-energy-eff']) },
    { label: 'Secondary heat',value: row['secondheat-description'] },
    { label: 'Hot water',     value: row['hotwater-description'],     color: efficiencyColor(row['hot-water-energy-eff']) },
    { label: 'Main fuel',     value: row['main-fuel'] },
  ]));

  // Lighting
  grid.appendChild(buildSectionCard('Lighting', [
    { label: 'Description',     value: row['lighting-description'], color: efficiencyColor(row['lighting-energy-eff']) },
    { label: '% low energy',    value: row['low-energy-lighting'] != null ? `${row['low-energy-lighting']}%` : null },
    { label: 'Fixed outlets',   value: row['fixed-lighting-outlets-count'] },
    { label: 'Low energy count',value: row['low-energy-fixed-light-count'] },
  ]));

  page.appendChild(grid);

  const relLinks = buildExternalLinks(row);
  if (relLinks) page.appendChild(relLinks);

  if (lmkKey) page.appendChild(buildNotesSection(lmkKey));

  return page;
}

function buildNotesSection(lmkKey) {
  const storageKey = `epc_note_${lmkKey}`;
  const saved = localStorage.getItem(storageKey) || '';

  const section = document.createElement('div');
  section.className = 'notes-section';
  section.innerHTML = `
    <h3 class="notes-title">My Notes</h3>
    <textarea class="notes-textarea" placeholder="Add your notes about this property…" maxlength="2000">${saved}</textarea>
    <div class="notes-footer">
      <span class="notes-status"></span>
      <span class="notes-gdpr">Notes are saved only in your browser and never sent anywhere.</span>
    </div>
  `;

  const textarea = section.querySelector('.notes-textarea');
  const status = section.querySelector('.notes-status');
  let timer;

  textarea.addEventListener('input', () => {
    clearTimeout(timer);
    status.textContent = '';
    timer = setTimeout(() => {
      const val = textarea.value.trim();
      if (val) {
        localStorage.setItem(storageKey, textarea.value);
      } else {
        localStorage.removeItem(storageKey);
      }
      status.textContent = 'Saved';
      setTimeout(() => { status.textContent = ''; }, 2000);
    }, 600);
  });

  return section;
}
