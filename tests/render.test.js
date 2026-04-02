import { describe, it, expect, beforeEach } from 'vitest';
import { buildCard, renderResults, renderPagination, renderSimplePagination } from '../src/render.js';

const PAGE_SIZE = 25;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function container() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

const fullRow = {
  'lmk-key': 'abc123def456',
  'current-energy-rating': 'C',
  'current-energy-efficiency': '72',
  'address1': '20 Sidmouth Close',
  'address2': '',
  'address3': '',
  'postcode': 'CV11 6FA',
  'property-type': 'House',
  'built-form': 'Semi-Detached',
  'tenure': 'owner-occupied',
  'total-floor-area': '78.0',
  'inspection-date': '2025-03-08',
  'lodgement-date': '2025-03-10',
};

// ─── buildCard ───────────────────────────────────────────────────────────────

describe('buildCard', () => {
  it('renders the rating badge with the correct letter', () => {
    const card = buildCard(fullRow);
    expect(card.querySelector('.rating-badge').textContent.trim()).toBe('C');
  });

  it('applies the correct CSS custom property for the rating colour', () => {
    const card = buildCard(fullRow);
    expect(card.style.getPropertyValue('--rating-color')).toBe('#8dba11');
  });

  it('renders the full address when all three address fields are present', () => {
    const row = { ...fullRow, address1: '1 High St', address2: 'Flat 2', address3: 'Anytown' };
    const card = buildCard(row);
    expect(card.querySelector('.address').textContent.trim()).toBe('1 High St, Flat 2, Anytown');
  });

  it('renders address1 only when address2 and address3 are empty', () => {
    const card = buildCard(fullRow);
    expect(card.querySelector('.address').textContent.trim()).toBe('20 Sidmouth Close');
  });

  it('renders "(no address)" when all address fields are missing', () => {
    const row = { ...fullRow, address1: '', address2: '', address3: '' };
    const card = buildCard(row);
    expect(card.querySelector('.address').textContent.trim()).toBe('(no address)');
  });

  it('renders the postcode', () => {
    const card = buildCard(fullRow);
    expect(card.querySelector('.postcode').textContent.trim()).toBe('CV11 6FA');
  });

  it('includes a link to the official EPC register when postcode is present', () => {
    const card = buildCard(fullRow);
    const link = card.querySelector('a[href*="find-energy-certificate"]');
    expect(link).not.toBeNull();
    expect(link.href).toContain('CV11');
  });

  it('opens the official register link in a new tab', () => {
    const card = buildCard(fullRow);
    const link = card.querySelector('a[href*="find-energy-certificate"]');
    expect(link.target).toBe('_blank');
  });

  it('omits the official register link when postcode is absent', () => {
    const row = { ...fullRow };
    delete row['postcode'];
    const card = buildCard(row);
    expect(card.querySelector('a[href*="find-energy-certificate"]')).toBeNull();
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('rating badge has an aria-label describing the rating', () => {
    const card = buildCard(fullRow);
    const badge = card.querySelector('.rating-badge');
    expect(badge.getAttribute('aria-label')).toMatch(/EPC rating/i);
    expect(badge.getAttribute('aria-label')).toContain('C');
  });

  it('uses dark text colour for rating C (WCAG contrast)', () => {
    const row = { ...fullRow, 'current-energy-rating': 'C' };
    const card = buildCard(row);
    const badge = card.querySelector('.rating-badge');
    expect(badge.style.color).toBe('rgb(26, 26, 46)'); // #1a1a2e
  });

  it('uses dark text colour for rating D (WCAG contrast)', () => {
    const row = { ...fullRow, 'current-energy-rating': 'D' };
    const card = buildCard(row);
    const badge = card.querySelector('.rating-badge');
    expect(badge.style.color).toBe('rgb(26, 26, 46)');
  });

  it('uses white text colour for rating A', () => {
    const row = { ...fullRow, 'current-energy-rating': 'A' };
    const card = buildCard(row);
    const badge = card.querySelector('.rating-badge');
    expect(badge.style.color).toBe('rgb(255, 255, 255)');
  });

  it('uses white text colour for rating G', () => {
    const row = { ...fullRow, 'current-energy-rating': 'G' };
    const card = buildCard(row);
    const badge = card.querySelector('.rating-badge');
    expect(badge.style.color).toBe('rgb(255, 255, 255)');
  });

  it('renders the score bar when efficiency score is present', () => {
    const card = buildCard(fullRow);
    const bar = card.querySelector('.score-bar-fill');
    expect(bar).not.toBeNull();
    expect(bar.style.width).toBe('72%');
  });

  it('omits the score bar when efficiency score is 0', () => {
    const row = { ...fullRow, 'current-energy-efficiency': '0' };
    const card = buildCard(row);
    expect(card.querySelector('.score-bar')).toBeNull();
  });

  it('omits the score bar when efficiency score is absent', () => {
    const row = { ...fullRow };
    delete row['current-energy-efficiency'];
    const card = buildCard(row);
    expect(card.querySelector('.score-bar')).toBeNull();
  });

  it('renders "?" badge and fallback colour for an unknown rating', () => {
    const row = { ...fullRow, 'current-energy-rating': undefined };
    const card = buildCard(row);
    expect(card.querySelector('.rating-badge').textContent.trim()).toBe('?');
    expect(card.style.getPropertyValue('--rating-color')).toBe('#aaa');
  });

  it('renders "–" for missing tenure', () => {
    const row = { ...fullRow, tenure: '' };
    const card = buildCard(row);
    const vals = card.querySelectorAll('.val');
    const tenureVal = Array.from(vals).find(v => {
      const key = v.previousElementSibling;
      return key && key.textContent.trim() === 'Tenure';
    });
    expect(tenureVal.textContent.trim()).toBe('–');
  });

  it('renders "–" for missing floor area', () => {
    const row = { ...fullRow, 'total-floor-area': '' };
    const card = buildCard(row);
    const vals = card.querySelectorAll('.val');
    const floorVal = Array.from(vals).find(v => {
      const key = v.previousElementSibling;
      return key && key.textContent.trim() === 'Floor Area';
    });
    expect(floorVal.textContent.trim()).toBe('–');
  });

  it('renders "–" for missing inspection date', () => {
    const row = { ...fullRow, 'inspection-date': '' };
    const card = buildCard(row);
    const vals = card.querySelectorAll('.val');
    const inspVal = Array.from(vals).find(v => {
      const key = v.previousElementSibling;
      return key && key.textContent.trim() === 'Inspected';
    });
    expect(inspVal.textContent.trim()).toBe('–');
  });

  it('includes built-form in the property type field when present', () => {
    const card = buildCard(fullRow);
    const vals = card.querySelectorAll('.val');
    const typeVal = Array.from(vals).find(v => {
      const key = v.previousElementSibling;
      return key && key.textContent.trim() === 'Property Type';
    });
    expect(typeVal.textContent.trim()).toBe('House · Semi-Detached');
  });

  it('omits the built-form separator when built-form is absent', () => {
    const row = { ...fullRow, 'built-form': '' };
    const card = buildCard(row);
    const vals = card.querySelectorAll('.val');
    const typeVal = Array.from(vals).find(v => {
      const key = v.previousElementSibling;
      return key && key.textContent.trim() === 'Property Type';
    });
    expect(typeVal.textContent.trim()).toBe('House');
  });

  // ── Improvement delta (feature 3) ─────────────────────────────────────────

  it('shows the improvement delta when current and potential ratings differ', () => {
    const row = { ...fullRow, 'current-energy-rating': 'D', 'potential-energy-rating': 'B' };
    const card = buildCard(row);
    expect(card.textContent).toMatch(/D.*B|D\s*→\s*B/);
  });

  it('omits the improvement delta when current equals potential rating', () => {
    const row = { ...fullRow, 'current-energy-rating': 'C', 'potential-energy-rating': 'C' };
    const card = buildCard(row);
    expect(card.querySelector('.improvement-delta')).toBeNull();
  });

  it('omits the improvement delta when potential rating is absent', () => {
    const row = { ...fullRow };
    delete row['potential-energy-rating'];
    const card = buildCard(row);
    expect(card.querySelector('.improvement-delta')).toBeNull();
  });

  // ── Tooltip on rating badge (feature 4) ───────────────────────────────────

  it('rating badge has a title tooltip describing the band', () => {
    const card = buildCard(fullRow); // fullRow has rating C
    const badge = card.querySelector('.rating-badge');
    expect(badge.getAttribute('title')).toMatch(/69|80|C/);
  });

  it('tooltip mentions the score range', () => {
    const row = { ...fullRow, 'current-energy-rating': 'A' };
    const card = buildCard(row);
    const badge = card.querySelector('.rating-badge');
    expect(badge.getAttribute('title')).toMatch(/92|100/);
  });
});

// ─── renderResults ───────────────────────────────────────────────────────────

describe('renderResults', () => {
  it('appends a results-grid div to the container', () => {
    const el = container();
    renderResults([fullRow], el);
    expect(el.querySelector('.results-grid')).not.toBeNull();
  });

  it('renders one card per row', () => {
    const el = container();
    renderResults([fullRow, fullRow, fullRow], el);
    expect(el.querySelectorAll('.epc-card')).toHaveLength(3);
  });

  it('does nothing when given an empty array', () => {
    const el = container();
    renderResults([], el);
    expect(el.querySelector('.results-grid')).toBeNull();
  });
});

// ─── renderPagination ────────────────────────────────────────────────────────

describe('renderPagination', () => {
  it('renders nothing when total fits on one page', () => {
    const el = container();
    renderPagination(1, PAGE_SIZE, el);
    expect(el.innerHTML.trim()).toBe('');
  });

  it('renders nothing when total is exactly PAGE_SIZE', () => {
    const el = container();
    renderPagination(1, PAGE_SIZE, el);
    expect(el.innerHTML.trim()).toBe('');
  });

  it('renders pagination when total exceeds PAGE_SIZE', () => {
    const el = container();
    renderPagination(1, PAGE_SIZE + 1, el);
    expect(el.querySelectorAll('button')).toHaveLength(2);
  });

  it('disables the Prev button on page 1', () => {
    const el = container();
    renderPagination(1, 100, el);
    const [prev] = el.querySelectorAll('button');
    expect(prev.disabled).toBe(true);
  });

  it('enables the Prev button on page 2+', () => {
    const el = container();
    renderPagination(2, 100, el);
    const [prev] = el.querySelectorAll('button');
    expect(prev.disabled).toBe(false);
  });

  it('disables the Next button on the last page', () => {
    const el = container();
    renderPagination(4, 100, el); // 100/25 = 4 pages
    const buttons = el.querySelectorAll('button');
    const next = buttons[buttons.length - 1];
    expect(next.disabled).toBe(true);
  });

  it('enables the Next button on non-last pages', () => {
    const el = container();
    renderPagination(1, 100, el);
    const buttons = el.querySelectorAll('button');
    const next = buttons[buttons.length - 1];
    expect(next.disabled).toBe(false);
  });

  it('shows the current page and total pages', () => {
    const el = container();
    renderPagination(2, 75, el); // 3 pages
    expect(el.textContent).toContain('Page 2 of 3');
  });

  it('formats large page counts with locale separators', () => {
    const el = container();
    renderPagination(1, 2500100, el); // 100,004 pages
    expect(el.textContent).toMatch(/of [\d,]+/);
  });
});

// ─── renderSimplePagination ──────────────────────────────────────────────────

describe('renderSimplePagination', () => {
  it('renders nothing on page 1 with no more results', () => {
    const el = container();
    renderSimplePagination(1, false, el);
    expect(el.innerHTML.trim()).toBe('');
  });

  it('renders pagination on page 1 when there are more results', () => {
    const el = container();
    renderSimplePagination(1, true, el);
    expect(el.querySelectorAll('button')).toHaveLength(2);
  });

  it('disables Prev on page 1', () => {
    const el = container();
    renderSimplePagination(1, true, el);
    const [prev] = el.querySelectorAll('button');
    expect(prev.disabled).toBe(true);
  });

  it('enables Next on page 1 when there are more results', () => {
    const el = container();
    renderSimplePagination(1, true, el);
    const buttons = el.querySelectorAll('button');
    expect(buttons[buttons.length - 1].disabled).toBe(false);
  });

  it('enables Prev and disables Next on page 2 with no more results', () => {
    const el = container();
    renderSimplePagination(2, false, el);
    const [prev, next] = el.querySelectorAll('button');
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(true);
  });

  it('enables both buttons on page 2 with more results', () => {
    const el = container();
    renderSimplePagination(2, true, el);
    const [prev, next] = el.querySelectorAll('button');
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(false);
  });

  it('shows the current page number', () => {
    const el = container();
    renderSimplePagination(3, true, el);
    expect(el.textContent).toContain('Page 3');
  });
});
