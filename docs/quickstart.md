# Quickstart

Three ways in, depending on what you are building. All of them are free and none
of them needs a key.

## 1. One HTTP request

```sh
curl -s https://www.usmortgagecalc.com/api/v1/calculate-mortgage \
  -H 'content-type: application/json' \
  -d '{"homePrice":400000,"downPaymentPercent":20,
       "annualInterestRatePercent":6.5,"loanTermYears":30,"state":"Texas"}'
```

```json
{
  "data": {
    "monthlyMortgage": 2022.62,
    "monthlyPropertyTax": 603.33,
    "monthlyInsurance": 150,
    "monthlyPmi": 0,
    "totalMonthlyCost": 2775.95,
    "loanAmount": 320000,
    "propertyTaxRate": 1.81,
    "assumptions": {
      "propertyTaxRatePercent": 1.81,
      "propertyTaxSource": "U.S. Census Bureau and Zillow Research"
    }
  },
  "meta": { "operation": "calculate_mortgage", "computedAt": "…" }
}
```

Two things to note now rather than later:

- **The result is under `data`.** Calculation endpoints wrap as `{ data, meta }`.
  The GET reference endpoints return their object directly.
- **`assumptions` travels with the answer.** Every figure carries the rate that
  produced it and where that rate came from, so a number can be explained rather
  than merely displayed.

## 2. From an AI agent

The MCP server needs no authentication and nothing to install.

```sh
claude mcp add --transport http usmortgagecalc https://www.usmortgagecalc.com/mcp
```

Or as configuration, for Claude Desktop:

```json
{
  "mcpServers": {
    "usmortgagecalc": {
      "type": "http",
      "url": "https://www.usmortgagecalc.com/mcp"
    }
  }
}
```

Cursor, VS Code and others: [docs/mcp.md](mcp.md).

**Check it worked** by asking the assistant something it cannot answer from
memory — *"what would a $450,000 house in New Jersey cost per month at 6.5% with
10% down?"* A real answer cites New Jersey's property tax rate and includes
mortgage insurance. If the figures are round and no state rate appears, the
server is not connected.

## 3. From your language

Runnable single-file clients live in [`sdk/`](../sdk/) for JavaScript,
TypeScript, Python, Go, PHP and C#. Each is about eighty lines, handles the
response envelope and error shape, and sends an API key if `USMC_API_KEY` is set.

```sh
node sdk/javascript/mortgage.js
python sdk/python/mortgage.py
```

There is no package to install for any of them — the API is one POST, and a
dependency you have to keep updated is a poor trade for that.

For a fully typed client, generate one from the spec rather than writing it:

```sh
npx openapi-typescript spec/openapi.json -o api.d.ts
```

## What to read next

| If you want to | Read |
| --- | --- |
| Every endpoint and field | [rest-api.md](rest-api.md) |
| Tools, resources and prompts | [mcp.md](mcp.md) |
| Why your request was rejected | [errors.md](errors.md) |
| How hard you can call it | [rate-limits.md](rate-limits.md) |
| Whether you need a key (you probably do not) | [authentication.md](authentication.md) |
| Putting a calculator on your own site | [embed.md](embed.md) |
| Bulk property tax data | [datasets.md](datasets.md) |
| How the pieces fit together | [architecture.md](architecture.md) |

## Ground rules

The calculators return **estimates** built from published state averages and the
figures you send. They are not financial advice, a loan offer, or a commitment to
lend. Every rate carries its source and the year it applies to — check
`/api/v1/assumptions` when a number needs defending.
