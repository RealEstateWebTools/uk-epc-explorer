import { getRatingColor, getRatingTextColor, formatDate, capitalize, getRatingBandInfo, getExpiryStatus } from './utils.js';

const REGISTER_SEARCH = 'https://find-energy-certificate.service.gov.uk/find-a-certificate/search-by-postcode';

export function buildCard(row) {
  const r = row['current-energy-rating'] || '?';
  const potR = row['potential-energy-rating'] || '';
  const color = getRatingColor(r);
  const score = parseInt(row['current-energy-efficiency'] || 0);
  const address = [row['address1'], row['address2'], row['address3']].filter(Boolean).join(', ');
  const postcode = row['postcode'] || '';
  const lodgeDate = row['lodgement-date'] ? formatDate(row['lodgement-date']) : '–';
  const inspDate = row['inspection-date'] ? formatDate(row['inspection-date']) : '–';
  const propType = row['property-type'] || '–';
  const builtForm = row['built-form'] || '';
  const tenure = row['tenure'] || '–';
  const totalFloor = row['total-floor-area'] ? `${row['total-floor-area']} m²` : '–';
  const registerLink = postcode
    ? `<a class="card-register-link" href="${REGISTER_SEARCH}?postcode=${encodeURIComponent(postcode)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">View on EPC Register ↗</a>`
    : '';

  const textColor = getRatingTextColor(r);

  const bandInfo = getRatingBandInfo(r);
  const tooltip = bandInfo ? `Rating ${r}: ${bandInfo.min}–${bandInfo.max} points (${bandInfo.description})` : `Rating ${r}`;

  const delta = (potR && potR !== r)
    ? `<div class="improvement-delta">Potential: <span class="delta-current">${r}</span> → <span class="delta-potential" style="color:${getRatingColor(potR)}">${potR}</span></div>`
    : '';

  const { status: expiryStatus, daysRemaining } = getExpiryStatus(row['lodgement-date']);
  const expiryBadge = expiryStatus === 'expired'
    ? `<div class="expiry-badge expiry-badge--expired">Certificate expired</div>`
    : expiryStatus === 'expiring-soon'
    ? `<div class="expiry-badge expiry-badge--soon">Expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</div>`
    : '';

  const card = document.createElement('div');
  card.className = 'epc-card';
  card.style.setProperty('--rating-color', color);
  card.innerHTML = `
    <div class="rating-badge" aria-label="EPC rating: ${r}" title="${tooltip}" style="color:${textColor}">${r}</div>
    <div class="address">${address || '(no address)'}</div>
    <div class="postcode">${postcode}</div>
    <div class="meta">
      <div class="meta-item"><div class="key">Property Type</div><div class="val">${propType}${builtForm ? ' · ' + builtForm : ''}</div></div>
      <div class="meta-item"><div class="key">Tenure</div><div class="val">${capitalize(tenure)}</div></div>
      <div class="meta-item"><div class="key">Floor Area</div><div class="val">${totalFloor}</div></div>
      <div class="meta-item"><div class="key">EPC Score</div><div class="val">${score || '–'} / 100</div></div>
      <div class="meta-item"><div class="key">Inspected</div><div class="val">${inspDate}</div></div>
      <div class="meta-item"><div class="key">Lodged</div><div class="val">${lodgeDate}</div></div>
    </div>
    ${score ? `<div class="score-bar"><div class="score-bar-fill" style="width:${score}%"></div></div>` : ''}
    ${delta}
    ${expiryBadge}
    ${registerLink}
  `;
  return card;
}

export function renderResults(rows, container) {
  if (!rows.length) return;
  const grid = document.createElement('div');
  grid.className = 'results-grid';
  rows.forEach(row => grid.appendChild(buildCard(row)));
  container.appendChild(grid);
}

export function renderPagination(page, total, container) {
  const PAGE_SIZE = 25;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return;

  container.innerHTML = `
    <button class="btn-page" onclick="search(${page - 1})" ${page <= 1 ? 'disabled' : ''}>← Prev</button>
    <span>Page ${page} of ${totalPages.toLocaleString()}</span>
    <button class="btn-page" onclick="search(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>Next →</button>
  `;
}

export function renderSimplePagination(page, hasMore, container) {
  if (page <= 1 && !hasMore) return;
  container.innerHTML = `
    <button class="btn-page" onclick="search(${page - 1})" ${page <= 1 ? 'disabled' : ''}>← Prev</button>
    <span>Page ${page}</span>
    <button class="btn-page" onclick="search(${page + 1})" ${!hasMore ? 'disabled' : ''}>Next →</button>
  `;
}
