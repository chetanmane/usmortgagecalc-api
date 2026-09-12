<div align="center">

# US Mortgage Calculator — API, SDKs & docs

**Developer toolkit for the [US Mortgage Calculator](https://www.usmortgagecalc.com) platform: OpenAPI and MCP specifications, SDKs in six languages, a Postman collection, and integration examples.**

[![Verify](https://github.com/chetanmane/usmortgagecalc-api/actions/workflows/verify.yml/badge.svg)](https://github.com/chetanmane/usmortgagecalc-api/actions/workflows/verify.yml)
[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Docs: CC BY 4.0](https://img.shields.io/badge/docs-CC%20BY%204.0-blue.svg)](LICENSE-DOCS)
[![MCP](https://img.shields.io/badge/MCP-streamable%20HTTP-6E56CF.svg)](docs/mcp.md)
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI-3.1-6BA539.svg)](spec/openapi.json)
[![Status](https://img.shields.io/badge/status-live-success.svg)](https://www.usmortgagecalc.com/status)

[Quickstart](docs/quickstart.md) ·
[REST API](docs/rest-api.md) ·
[MCP](docs/mcp.md) ·
[SDKs](sdk/) ·
[Examples](examples/) ·
[Architecture](docs/architecture.md)

</div>

---

Mortgage calculations for all fifty US states — payment, amortisation, PMI and
MIP, property tax, affordability, refinance, closing costs, rent-vs-buy and loan
comparison — with the property tax rate, its source and the year it applies to
returned alongside every figure.

**Free. No signup. No API key required.**

```sh
curl -s https://www.usmortgagecalc.com/api/v1/calculate-mortgage \
  -H 'content-type: application/json' \
  -d '{"homePrice":400000,"downPaymentPercent":20,
       "annualInterestRatePercent":6.5,"loanTermYears":30,"state":"Texas"}'
```

Returns `$2,699.28` a month, itemised, with the assumptions that produced it.

## What is in this repository

| | |
| --- | --- |
| [`docs/`](docs/) | Quickstart, REST reference, MCP guide, errors, rate limits, auth, embedding, datasets, architecture |
| [`spec/openapi.json`](spec/openapi.json) | OpenAPI 3.1, 16 endpoints |
| [`spec/mcp-server.json`](spec/mcp-server.json) | MCP server card — 11 tools, 7 resources, 7 prompts |
| [`spec/postman_collection.json`](spec/postman_collection.json) | Every endpoint, ready to run |
| [`sdk/`](sdk/) | Single-file clients: JavaScript, TypeScript, Python, Go, PHP, C# |
| [`examples/`](examples/) | MCP clients, agent tool definitions, embedding, GitHub Actions |

**This repository contains no server code.** The calculation engine, website, API
and MCP implementations, and infrastructure are closed source. Everything here is
what you need to *call* the platform — see
[architecture.md](docs/architecture.md#what-is-not-here) for the explicit list.

## Three ways in

### HTTP

```sh
npx openapi-typescript spec/openapi.json -o api.d.ts   # typed client, any language
```

Or import [`spec/postman_collection.json`](spec/postman_collection.json) and click
Send. All sixteen requests are verified against production on every CI run.

### AI agents

```sh
claude mcp add --transport http usmortgagecalc https://www.usmortgagecalc.com/mcp
```

No authentication, nothing to install. Claude Desktop, Cursor and VS Code
configuration in [docs/mcp.md](docs/mcp.md).

### Your language

```sh
node sdk/javascript/mortgage.js
python sdk/python/mortgage.py
```

Single files, no dependencies, no package to install. The API is one POST — a
dependency you have to keep updated is a poor trade for that.

## Verifying these specs are current

The specs are artifacts published by the platform, mirrored here. They can go
stale, so nothing asks you to trust that they have not:

```sh
npm run verify        # every example and spec, against the live API
npm run sync          # pull the current specs from production
```

CI runs `verify` on every push and daily, and fails if a spec here no longer
matches what production serves.

## Licence

**Code** — SDKs, examples, scripts — is [MIT](LICENSE).
**Documentation and specifications** are [CC BY 4.0](LICENSE-DOCS).

Both permit commercial use. The [datasets](docs/datasets.md) published by the
platform are separately CC BY 4.0.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Documentation gaps are the most valuable
thing to report here: if you had to read source or guess to integrate, that is a
bug in these docs.

Bugs in the *service* — a wrong number, a failing endpoint — belong here too;
they will be reproduced against production and fixed in the private repository,
and you will be told when the fix ships.

Security issues: [SECURITY.md](SECURITY.md), not a public issue.

## Disclaimer

The calculators produce estimates from the figures you send and from publicly
available state averages. They are not financial advice, a loan offer, or a
commitment to lend. This project is not a lender, mortgage broker, or tax
advisor. Confirm rates, property taxes, insurance premiums and loan terms with
licensed professionals before making a financial decision.
