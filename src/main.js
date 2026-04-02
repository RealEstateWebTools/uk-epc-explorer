import { renderResults, renderPagination, renderSimplePagination } from './render.js';
import { validateSearch, buildSearchParamsFor, parseApiResponse, fetchWithFallback, fetchCertificateWithFallback } from './api.js';
import { buildDetailPage } from './detail.js';
import { parseRoute, parseSearchFilters, buildSearchUrl, navigate } from './router.js';
import { sortResults, filterByRating, SORT_FIELDS } from './sort-filter.js';
import { toCsv, downloadCsv } from './export.js';
import { buildEmptyState } from './utils.js';

const PAGE_SIZE = 25;

// ── Credentials ────────────────────────────────────────────────────────────────

function getCredentials() {
  const email = document.getElementById('api-email').value.trim();
  const key = document.getElementById('api-key').value.trim();
  if (email) localStorage.setItem('epc_email', email);
  if (key) localStorage.setItem('epc_key', key);
  return {
    email: email || localStorage.getItem('epc_email') || '',
    key: key || localStorage.getItem('epc_key') || '',
  };
}

window.addEventListener('load', () => {
  const email = localStorage.getItem('epc_email');
  const key = localStorage.getItem('epc_key');
  if (email) document.getElementById('api-email').value = email;
  if (key) document.getElementById('api-key').value = key;
  // Credentials are optional — leave details closed by default
});

// ── Toolbar state ──────────────────────────────────────────────────────────────

let allRows = [];           // full page of rows from API
let activeRatings = new Set(); // empty = show all
let sortField = 'current-energy-rating';
let sortDir = 'asc';
let propertyType = 'domestic'; // 'domestic' | 'non-domestic'

const RATING_COLORS_MAP = { A:'#00813d',B:'#1fac28',C:'#8dba11',D:'#ffd500',E:'#f4a020',F:'#e55a10',G:'#e01616' };
const RATING_TEXT       = { A:'#fff',B:'#fff',C:'#1a1a2e',D:'#1a1a2e',E:'#fff',F:'#fff',G:'#fff' };

// ── Router ─────────────────────────────────────────────────────────────────────

async function render() {
  const root = document.getElementById('view-root');
  const route = parseRoute(window.location.pathname);
  if (route.view === 'detail') {
    await renderDetail(root, route.lmkKey);
  } else {
    const filters = parseSearchFilters(window.location.search);
    renderSearch(root, filters);
    if (filters.postcode || filters.localAuth || filters.rating) {
      await runSearch(filters.page, filters);
    }
  }
}

function ratingOptions(selected) {
  return ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].map(r =>
    `<option value="${r}" ${r === selected ? 'selected' : ''}>${r || 'Any'}</option>`
  ).join('');
}

function renderSearch(root, filters = {}) {
  root.innerHTML = `
    <div class="type-toggle">
      <button class="type-btn ${propertyType === 'domestic' ? 'active' : ''}" onclick="window.setPropertyType('domestic')">Domestic</button>
      <button class="type-btn ${propertyType === 'non-domestic' ? 'active' : ''}" onclick="window.setPropertyType('non-domestic')">Commercial</button>
    </div>
    <div class="search-card">
      <h2>Search Properties</h2>
      <div class="filters">
        <div>
          <label for="postcode">Postcode</label>
          <input type="text" id="postcode" placeholder="e.g. SW1A 1AA" maxlength="10" value="${filters.postcode || ''}">
        </div>
        <div>
          <label for="local-authority">Local Authority</label>
          <input type="text" id="local-authority" placeholder="e.g. Westminster" value="${filters.localAuth || ''}">
        </div>
        <div>
          <label for="rating">EPC Rating</label>
          <select id="rating">${ratingOptions(filters.rating || '')}</select>
        </div>
        <div>
          <label for="from-year">From Year</label>
          <input type="number" id="from-year" placeholder="2008" min="2008" max="2026" style="width:100px" value="${filters.fromYear || ''}">
        </div>
        <button class="btn-search" id="search-btn" onclick="window.runSearch(1)">Search</button>
      </div>
    </div>
    <div class="data-notice">
      <span>ℹ</span>
      <span>Data from the <strong>EPC Register</strong> (England &amp; Wales). Each certificate reflects the most recently lodged assessment — not necessarily the current property condition.</span>
    </div>
    <div id="status"></div>
    <div id="toolbar" style="display:none"></div>
    <div id="results"></div>
    <div id="pagination"></div>
  `;
}

function renderToolbar(rows, filters) {
  const toolbar = document.getElementById('toolbar');
  if (!toolbar) return;
  toolbar.style.display = 'flex';

  const sortOpts = SORT_FIELDS.map(f =>
    `<option value="${f.value}" ${f.value === sortField ? 'selected' : ''}>${f.label}</option>`
  ).join('');

  const chips = ['A','B','C','D','E','F','G'].map(r => {
    const bg = RATING_COLORS_MAP[r];
    const color = RATING_TEXT[r];
    const active = activeRatings.size === 0 || activeRatings.has(r) ? 'active' : '';
    return `<button class="rating-chip ${active}" style="background:${bg};color:${color}" onclick="window.toggleRating('${r}')" aria-label="Filter rating ${r}" title="Rating ${r}">${r}</button>`;
  }).join('');

  toolbar.className = 'results-toolbar';
  toolbar.innerHTML = `
    <span class="toolbar-label">Sort</span>
    <select class="sort-select" onchange="window.onSortChange(this.value)">${sortOpts}</select>
    <button class="sort-dir-btn" onclick="window.toggleSortDir()" title="${sortDir === 'asc' ? 'Ascending' : 'Descending'}">${sortDir === 'asc' ? '↑' : '↓'}</button>
    <span class="toolbar-label" style="margin-left:0.5rem">Filter</span>
    <div class="rating-filter-chips">${chips}</div>
    <div class="toolbar-actions">
      <button class="btn-action" id="copy-btn" onclick="window.copyLink()">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>
        Copy link
      </button>
      <button class="btn-action" onclick="window.exportCsv()">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
        Export CSV
      </button>
    </div>
  `;
}

function applyAndRender() {
  const filtered = filterByRating(allRows, activeRatings);
  const sorted = sortResults(filtered, sortField, sortDir);
  const resultsEl = document.getElementById('results');
  if (!resultsEl) return;
  resultsEl.innerHTML = '';
  renderResults(sorted, resultsEl);
  resultsEl.querySelectorAll('.epc-card').forEach((card, i) => {
    const lmkKey = sorted[i]['lmk-key'];
    if (lmkKey) card.addEventListener('click', () => navigate(`/certificate/${lmkKey}`));
  });
}

window.onSortChange = function(field) {
  sortField = field;
  applyAndRender();
};

window.toggleSortDir = function() {
  sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  applyAndRender();
  renderToolbar(allRows, {});
};

window.toggleRating = function(r) {
  if (activeRatings.size === 0) {
    // First click activates only that rating (invert: hide all others)
    activeRatings = new Set(['A','B','C','D','E','F','G'].filter(x => x !== r));
  } else if (activeRatings.has(r)) {
    activeRatings.delete(r);
    if (activeRatings.size === 7) activeRatings = new Set(); // all hidden = reset to all
  } else {
    activeRatings.add(r);
    if (activeRatings.size === 7) activeRatings = new Set();
  }
  applyAndRender();
  renderToolbar(allRows, {});
};

window.copyLink = function() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.getElementById('copy-btn');
    if (!btn) return;
    btn.classList.add('copied');
    btn.innerHTML = btn.innerHTML.replace('Copy link', 'Copied!');
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = btn.innerHTML.replace('Copied!', 'Copy link');
    }, 2000);
  });
};

window.exportCsv = function() {
  const filtered = filterByRating(allRows, activeRatings);
  const sorted = sortResults(filtered, sortField, sortDir);
  const filename = `epc-results-${new Date().toISOString().slice(0,10)}.csv`;
  downloadCsv(filename, toCsv(sorted));
};

window.setPropertyType = function(type) {
  propertyType = type;
  activeRatings = new Set();
  const root = document.getElementById('view-root');
  const filters = parseSearchFilters(window.location.search);
  renderSearch(root, filters);
};

async function renderDetail(root, lmkKey) {
  root.innerHTML = '<div style="padding:2rem;text-align:center"><span class="spinner"></span> Loading certificate…</div>';
  const creds = getCredentials();
  try {
    const row = await fetchCertificateWithFallback(lmkKey, creds);
    root.innerHTML = '';
    root.appendChild(buildDetailPage(row));
    root.querySelector('a[href="/"]').addEventListener('click', e => {
      e.preventDefault();
      navigate('/');
    });
  } catch (err) {
    root.innerHTML = `<div class="error-msg"><strong>Error:</strong> ${err.message}</div>
      <p style="margin-top:1rem"><a href="/" onclick="event.preventDefault();navigate('/')">← Back to search</a></p>`;
  }
}

// ── Search ─────────────────────────────────────────────────────────────────────

window.runSearch = async function runSearch(page = 1, prebuiltFilters) {
  const filters = prebuiltFilters || {
    postcode: document.getElementById('postcode').value.trim(),
    localAuth: document.getElementById('local-authority').value.trim(),
    rating: document.getElementById('rating').value,
    fromYear: document.getElementById('from-year').value.trim(),
  };
  const creds = getCredentials();

  const validationError = validateSearch(filters);
  if (validationError) {
    setStatus(`<span style="color:#c0392b">${validationError}</span>`);
    return;
  }

  const searchUrl = buildSearchUrl(filters, page);
  if (window.location.pathname + window.location.search !== searchUrl) {
    history.pushState(null, '', searchUrl);
  }

  const btn = document.getElementById('search-btn');
  if (btn) btn.disabled = true;
  setStatus('<span class="spinner"></span> Searching...');
  document.getElementById('results').innerHTML = '';
  document.getElementById('pagination').innerHTML = '';
  const toolbar = document.getElementById('toolbar');
  if (toolbar) toolbar.style.display = 'none';

  try {
    const { url, params } = buildSearchParamsFor(propertyType, filters, page);
    const data = await fetchWithFallback(params, creds, url);
    const { rows, total, hasMore } = parseApiResponse(data);
    const totalResults = total ?? rows.length;

    if (rows.length === 0) {
      setStatus('');
      document.getElementById('results').innerHTML = `<div class="empty-state">${buildEmptyState(filters)}</div>`;
    } else {
      allRows = rows;
      activeRatings = new Set();
      renderToolbar(rows, filters);
      applyAndRender();

      if (total != null) {
        renderPagination(page, totalResults, document.getElementById('pagination'));
        setStatus(`Showing ${(page-1)*PAGE_SIZE + 1}–${Math.min(page*PAGE_SIZE, totalResults)} of <strong>${totalResults.toLocaleString()}</strong> certificates`);
      } else {
        renderSimplePagination(page, hasMore, document.getElementById('pagination'));
        setStatus(`Showing ${(page-1)*PAGE_SIZE + 1}–${(page-1)*PAGE_SIZE + rows.length} certificates${hasMore ? ' (more available)' : ''}`);
      }

      document.getElementById('pagination').querySelectorAll('button:not([disabled])').forEach(b => {
        const match = b.getAttribute('onclick')?.match(/search\((\d+)\)/);
        if (match) {
          b.removeAttribute('onclick');
          b.addEventListener('click', () => navigate(buildSearchUrl(filters, parseInt(match[1], 10))));
        }
      });
    }
  } catch (err) {
    setStatus('');
    document.getElementById('results').innerHTML = `<div class="error-msg"><strong>Error:</strong> ${err.message}</div>`;
  } finally {
    const b = document.getElementById('search-btn');
    if (b) b.disabled = false;
  }
};

function setStatus(html) {
  const el = document.getElementById('status');
  if (el) el.innerHTML = html;
}

// ── Boot ───────────────────────────────────────────────────────────────────────

window.addEventListener('popstate', render);
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && window.location.pathname === '/') window.runSearch(1);
});

render();
