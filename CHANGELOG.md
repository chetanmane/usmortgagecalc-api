# Changelog

Changes to this repository — documentation, SDKs, specifications and examples.

Platform changes are announced in the specs themselves: the REST API carries its
version in the path, and breaking changes to a response shape arrive at
`/api/v2` rather than by editing v1 underneath callers.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Fixed

- **The worked example moved again with the ACS 2020-2024 refresh.** The platform
  rebuilt its state tax table from the 2020-2024 ACS 5-year release on Nov 7,
  which moved Texas from 1.58% to 1.49% and the documented $400,000 example
  from $2,699.28 a month to $2,669.28 (property tax $526.67 to $496.67). The
  README, the quickstart and the REST reference are updated, along with the
  stale `totalAllPayments` in the REST reference.
- **The specs were behind production.** `spec/openapi.json` now includes
  `/api/v1/rates` and the published input maximums, `spec/mcp-server.json` is
  at 1.1.0, and the Postman collection has the new request.
- **The worked example was out of date everywhere it appeared.** The platform
  rebuilt its state property tax table from a single U.S. Census Bureau ACS
  release, which moved Texas from 1.81% to 1.58% and the documented $400,000
  example from $2,775.95 a month to $2,699.28. The README, the quickstart and
  the REST reference all still quoted the old figures, as did `npm run verify`
  itself — which is why the nightly run went red rather than catching it at the
  time.
- **The pandas example named columns the CSV has never had.** The dataset's
  headers are snake_case (`avg_effective_tax_rate_percent`); the example used
  camelCase, so running it raised `KeyError`.

### Added

- **`npm run verify` now checks the documentation against the live API.** It
  reads the worked example's figures back out of the Markdown and compares them
  with a real response, so prose and product cannot drift apart silently again.
- **`state-property-tax-history`** in the dataset list — 700 rows, every state
  for every year from 2010 to 2024, with a note on why it and the current-year
  table disagree and why 2020 is absent.

## 1.0.0 — 2026-08-14

First public release. Extracted from the platform's private repository so the
developer-facing material can be read, forked and corrected independently of the
closed-source server.

### Added

- **Documentation** — quickstart, REST reference, MCP guide, error codes, rate
  limits, authentication, embedding, datasets, and an architecture overview with
  diagrams.
- **Specifications** — OpenAPI 3.1 (16 endpoints), MCP server card (11 tools,
  7 resources, 7 prompts), and a generated Postman collection.
- **SDKs** — single-file clients for JavaScript, TypeScript, Python, Go, PHP and
  C#. No dependencies and no package to install.
- **Examples** — MCP client configuration, OpenAI-style agent tool generation,
  embedding for React, Next.js, Vue and Angular, and a GitHub Actions workflow
  that watches published assumptions for change.
- **`npm run verify`** — checks every artifact here against the live API: both
  specs diffed against production, every Postman request sent, the documented
  error shape and headers asserted, and the JavaScript SDK executed.
- **`npm run sync`** — pulls current specs from production and rebuilds the
  collection.

### Fixed during extraction

Carried over from fixes made in the private repository the same week:

- All six SDKs read `error.type` and `error.field`; the API returns `error.code`
  and `error.issues[]`. Reading the wrong names failed silently as `undefined`.
  Contract verification had only ever been run against a success response, so the
  error path was unchecked in every language at once.
- Six generated Postman requests returned 400. `state` is required in practice
  but expressed as a runtime either/or with `propertyTaxRatePercent`, so it is
  absent from the OpenAPI `required` list and was omitted from generated bodies.
  `compare-loans` additionally needs at least two scenarios.
- The `{state}` path parameter was emitted with OpenAPI's single braces, which
  Postman treats as literal characters, producing a 404.

### Notes

- Code is MIT; documentation and specifications are CC BY 4.0. Neither grants any
  right to the platform itself.
- Rate limits are documented as **ceilings, not guarantees** — enforcement is
  per serverless instance, so a burst can exceed the stated figure. Build against
  the headers and the 429 rather than the number.
