import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildDetailPage,
  buildRatingBar,
  buildSectionCard,
  buildCostRow,
  efficiencyColor,
} from '../src/detail.js';

// ─── Full fixture from real API response ────────────────────────────────────

const fullRow = {
  'lmk-key': '31d68876c3693c993e2791b05544c569e9bc07916389b667aab0b892f7874550',
  'address1': '16 Sidmouth Close',
  'address2': '',
  'address3': '',
  'postcode': 'CV11 6FA',
  'property-type': 'House',
  'built-form': 'Semi-Detached',
  'construction-age-band': 'England and Wales: 1983-1990',
  'tenure': 'Owner-occupied',
  'transaction-type': 'marketed sale',
  'total-floor-area': '78.0',
  'floor-height': '2.38',
  'number-habitable-rooms': '4',
  'number-heated-rooms': '4',
  'current-energy-rating': 'D',
  'potential-energy-rating': 'B',
  'current-energy-efficiency': '66',
  'potential-energy-efficiency': '87',
  'environment-impact-current': '62',
  'environment-impact-potential': '85',
  'energy-consumption-current': '246',
  'energy-consumption-potential': '88',
  'co2-emissions-current': '3.4',
  'co2-emissions-potential': '1.2',
  'co2-emiss-curr-per-floor-area': '43',
  'heating-cost-current': '718',
  'heating-cost-potential': '562',
  'hot-water-cost-current': '264',
  'hot-water-cost-potential': '102',
  'lighting-cost-current': '83',
  'lighting-cost-potential': '83',
  'inspection-date': '2025-04-28',
  'lodgement-date': '2025-04-28',
  'lodgement-datetime': '2025-04-28 15:22:15',
  'uprn': '100070164917',
  'mainheat-description': 'Boiler and radiators, mains gas',
  'mainheat-energy-eff': 'Good',
  'mainheat-env-eff': 'Good',
  'mainheatcont-description': 'Programmer, room thermostat and TRVs',
  'mainheatc-energy-eff': 'Good',
  'secondheat-description': 'Room heaters, mains gas',
  'hotwater-description': 'From main system',
  'hot-water-energy-eff': 'Average',
  'walls-description': 'Cavity wall, filled cavity',
  'walls-energy-eff': 'Good',
  'walls-env-eff': 'Good',
  'roof-description': 'Pitched, 150 mm loft insulation',
  'roof-energy-eff': 'Good',
  'roof-env-eff': 'Good',
  'floor-description': 'Solid, no insulation (assumed)',
  'floor-energy-eff': 'N/A',
  'windows-description': 'Fully double glazed',
  'windows-energy-eff': 'Good',
  'windows-env-eff': 'Good',
  'lighting-description': 'Low energy lighting in all fixed outlets',
  'lighting-energy-eff': 'Very Good',
  'main-fuel': 'mains gas (not community)',
  'mains-gas-flag': 'Y',
  'solar-water-heating-flag': 'N',
  'low-energy-lighting': '100',
  'fixed-lighting-outlets-count': '10',
  'local-authority-label': 'Nuneaton and Bedworth',
  'constituency-label': '',
};

// ─── efficiencyColor ─────────────────────────────────────────────────────────

describe('efficiencyColor', () => {
  it('returns green for "Very Good"', () => {
    expect(efficiencyColor('Very Good')).toBe('#00813d');
  });

  it('returns light green for "Good"', () => {
    expect(efficiencyColor('Good')).toBe('#1fac28');
  });

  it('returns amber for "Average"', () => {
    expect(efficiencyColor('Average')).toBe('#ffd500');
  });

  it('returns orange for "Poor"', () => {
    expect(efficiencyColor('Poor')).toBe('#f4a020');
  });

  it('returns red for "Very Poor"', () => {
    expect(efficiencyColor('Very Poor')).toBe('#e01616');
  });

  it('returns grey for "N/A"', () => {
    expect(efficiencyColor('N/A')).toBe('#ccc');
  });

  it('returns grey for unknown values', () => {
    expect(efficiencyColor('NO DATA!')).toBe('#ccc');
  });

  it('returns grey for empty string', () => {
    expect(efficiencyColor('')).toBe('#ccc');
  });

  it('returns grey for null', () => {
    expect(efficiencyColor(null)).toBe('#ccc');
  });
});

// ─── buildRatingBar ───────────────────────────────────────────────────────────

describe('buildRatingBar', () => {
  it('renders the rating letter', () => {
    const el = buildRatingBar('D', 66);
    expect(el.textContent).toContain('D');
  });

  it('renders the numeric score', () => {
    const el = buildRatingBar('D', 66);
    expect(el.textContent).toContain('66');
  });

  it('sets the bar width to the score percentage', () => {
    const el = buildRatingBar('C', 72);
    const fill = el.querySelector('.rating-bar-fill');
    expect(fill.style.width).toBe('72%');
  });

  it('sets the rating colour via --rating-color CSS variable', () => {
    const el = buildRatingBar('A', 92);
    expect(el.style.getPropertyValue('--rating-color')).toBe('#00813d');
  });

  it('handles a score of 0 without crashing', () => {
    expect(() => buildRatingBar('G', 0)).not.toThrow();
  });
});

// ─── buildSectionCard ─────────────────────────────────────────────────────────

describe('buildSectionCard', () => {
  it('renders the section title', () => {
    const el = buildSectionCard('Heating', []);
    expect(el.textContent).toContain('Heating');
  });

  it('renders each item label', () => {
    const el = buildSectionCard('Test', [
      { label: 'Fuel type', value: 'Gas' },
      { label: 'Efficiency', value: 'Good' },
    ]);
    expect(el.textContent).toContain('Fuel type');
    expect(el.textContent).toContain('Efficiency');
  });

  it('renders each item value', () => {
    const el = buildSectionCard('Test', [
      { label: 'Fuel type', value: 'Gas' },
    ]);
    expect(el.textContent).toContain('Gas');
  });

  it('renders a coloured dot when a color is provided', () => {
    const el = buildSectionCard('Test', [
      { label: 'Eff', value: 'Good', color: '#1fac28' },
    ]);
    const dot = el.querySelector('.eff-dot');
    expect(dot).not.toBeNull();
    expect(dot.style.background).toBe('rgb(31, 172, 40)'); // #1fac28
  });

  it('does not render a dot when no color is provided', () => {
    const el = buildSectionCard('Test', [{ label: 'Type', value: 'House' }]);
    expect(el.querySelector('.eff-dot')).toBeNull();
  });

  it('renders "–" for a null value', () => {
    const el = buildSectionCard('Test', [{ label: 'X', value: null }]);
    expect(el.textContent).toContain('–');
  });

  it('renders "–" for an empty string value', () => {
    const el = buildSectionCard('Test', [{ label: 'X', value: '' }]);
    expect(el.textContent).toContain('–');
  });
});

// ─── buildCostRow ─────────────────────────────────────────────────────────────

describe('buildCostRow', () => {
  it('renders the label', () => {
    const el = buildCostRow('Heating', 718, 562);
    expect(el.textContent).toContain('Heating');
  });

  it('renders the current cost with £ sign', () => {
    const el = buildCostRow('Heating', 718, 562);
    expect(el.textContent).toContain('£718');
  });

  it('renders the potential cost with £ sign', () => {
    const el = buildCostRow('Heating', 718, 562);
    expect(el.textContent).toContain('£562');
  });

  it('renders a positive saving when potential < current', () => {
    const el = buildCostRow('Heating', 718, 562);
    expect(el.textContent).toContain('£156');
  });

  it('renders zero saving when costs are equal', () => {
    const el = buildCostRow('Lighting', 83, 83);
    expect(el.textContent).toContain('£0');
  });

  it('shows "–" when current cost is missing', () => {
    const el = buildCostRow('Heating', null, 562);
    expect(el.textContent).toContain('–');
  });

  it('shows "–" when potential cost is missing', () => {
    const el = buildCostRow('Heating', 718, null);
    expect(el.textContent).toContain('–');
  });

  it('applies a positive-saving CSS class when saving > 0', () => {
    const el = buildCostRow('Heating', 718, 562);
    expect(el.querySelector('.saving-positive')).not.toBeNull();
  });

  it('does not apply positive-saving class when saving is 0', () => {
    const el = buildCostRow('Lighting', 83, 83);
    expect(el.querySelector('.saving-positive')).toBeNull();
  });
});

// ─── buildDetailPage ─────────────────────────────────────────────────────────

describe('buildDetailPage', () => {
  let page;
  beforeEach(() => { page = buildDetailPage(fullRow); });

  it('returns a DOM element', () => {
    expect(page).toBeInstanceOf(HTMLElement);
  });

  // Address & header
  it('renders the address', () => {
    expect(page.textContent).toContain('16 Sidmouth Close');
  });

  it('renders the postcode', () => {
    expect(page.textContent).toContain('CV11 6FA');
  });

  it('renders the current rating letter', () => {
    expect(page.textContent).toContain('D');
  });

  it('renders the potential rating letter', () => {
    expect(page.textContent).toContain('B');
  });

  it('renders the current EPC score', () => {
    expect(page.textContent).toContain('66');
  });

  it('renders the potential EPC score', () => {
    expect(page.textContent).toContain('87');
  });

  // Certificate info
  it('renders a truncated version of the lmk-key', () => {
    // should show at least first 8 chars
    expect(page.textContent).toContain('31d68876');
  });

  it('renders the inspection date in human-readable form', () => {
    expect(page.textContent).toContain('28 Apr 2025');
  });

  it('renders the UPRN', () => {
    expect(page.textContent).toContain('100070164917');
  });

  it('renders the transaction type', () => {
    expect(page.textContent).toContain('marketed sale');
  });

  // Property details
  it('renders the property type and built form', () => {
    expect(page.textContent).toContain('House');
    expect(page.textContent).toContain('Semi-Detached');
  });

  it('renders the construction age band', () => {
    expect(page.textContent).toContain('1983-1990');
  });

  it('renders the floor area', () => {
    expect(page.textContent).toContain('78.0');
  });

  // Costs
  it('renders the heating cost', () => {
    expect(page.textContent).toContain('£718');
  });

  it('renders the hot water cost', () => {
    expect(page.textContent).toContain('£264');
  });

  it('renders the lighting cost', () => {
    expect(page.textContent).toContain('£83');
  });

  it('renders a cost saving for heating', () => {
    // 718 - 562 = 156
    expect(page.textContent).toContain('£156');
  });

  // CO2 / energy
  it('renders current CO2 emissions', () => {
    expect(page.textContent).toContain('3.4');
  });

  it('renders potential CO2 emissions', () => {
    expect(page.textContent).toContain('1.2');
  });

  it('renders current energy consumption', () => {
    expect(page.textContent).toContain('246');
  });

  // Building fabric
  it('renders walls description', () => {
    expect(page.textContent).toContain('Cavity wall, filled cavity');
  });

  it('renders roof description', () => {
    expect(page.textContent).toContain('150 mm loft insulation');
  });

  it('renders windows description', () => {
    expect(page.textContent).toContain('Fully double glazed');
  });

  it('renders floor description', () => {
    expect(page.textContent).toContain('Solid, no insulation');
  });

  // Heating
  it('renders the main heat description', () => {
    expect(page.textContent).toContain('Boiler and radiators');
  });

  it('renders the main fuel type', () => {
    expect(page.textContent).toContain('mains gas');
  });

  it('renders the secondary heat description', () => {
    expect(page.textContent).toContain('Room heaters');
  });

  // Lighting
  it('renders the lighting description', () => {
    expect(page.textContent).toContain('Low energy lighting in all fixed outlets');
  });

  it('renders the % low energy lighting', () => {
    expect(page.textContent).toContain('100');
  });

  // Back link
  it('contains a back link to "/"', () => {
    const link = page.querySelector('a[href="/"]');
    expect(link).not.toBeNull();
  });

  // Missing data
  it('does not crash when optional fields are absent', () => {
    expect(() => buildDetailPage({ 'lmk-key': 'abc', 'current-energy-rating': 'C' })).not.toThrow();
  });

  it('shows "–" for missing address fields', () => {
    const sparse = buildDetailPage({ 'lmk-key': 'abc', 'current-energy-rating': 'C' });
    expect(sparse.textContent).toContain('(no address)');
  });
});
