# UK EPC Explorer

A fast, clean interface for searching and exploring UK Energy Performance Certificate (EPC) data. Search by postcode, local authority, or rating — and drill into full certificate details for any property in England and Wales.

**Live demo: [epc.homestocompare.com](https://epc.homestocompare.com/)**

---

## Features

- **Search** by postcode, local authority, EPC rating (A–G), and year
- **Unique URLs** for every search and certificate — bookmarkable and shareable
- **Detail pages** for each certificate showing running costs, CO₂ emissions, building fabric, heating, and improvement potential
- **Links to the official EPC Register** so data can be independently verified
- **No server required** — all data fetched directly from the public EPC API

## Data source

Data is sourced from the [Energy Performance of Buildings Register](https://epc.opendatacommunities.org), published by the Department for Energy Security and Net Zero. Licensed under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

## API credentials

The EPC Register API is free but requires registration. [Sign up here](https://epc.opendatacommunities.org/login) — it takes under a minute. Enter your email and API key in the app; they are stored only in your browser's `localStorage` and never sent anywhere except the EPC API directly.

## Running locally

```bash
git clone https://github.com/RealEstateWebTools/uk-epc-explorer.git
cd uk-epc-explorer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running tests

```bash
npm test
```

207 tests across 5 suites covering utilities, rendering, API logic, routing, and detail page assembly.

## Deploying to Cloudflare Pages

**Via GitHub (recommended):**
1. Fork or push to your own GitHub repo
2. Go to [Cloudflare Pages](https://dash.cloudflare.com) → Workers & Pages → Create → Connect to Git
3. Select the repo, set build output directory to `.`, leave build command blank
4. Deploy

**Via CLI:**
```bash
npx wrangler pages deploy . --project-name uk-epc-explorer
```

## Tech

Pure HTML, CSS, and vanilla ES modules — no framework, no bundler, no build step. Tests run with [Vitest](https://vitest.dev/) + jsdom.

## Licence

Code: MIT. EPC data: Open Government Licence v3.0.
