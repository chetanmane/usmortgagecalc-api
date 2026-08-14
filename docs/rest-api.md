# REST API

JSON over HTTPS. Base URL `https://www.usmortgagecalc.com`.

Calculation endpoints take `POST` with a JSON body. Reference endpoints take
`GET`. Everything is free and unauthenticated; an API key raises a rate limit
rather than granting access.

The authoritative description is [`spec/openapi.json`](../spec/openapi.json) —
this page is the prose around it, and the spec wins if they ever disagree.

## Endpoints

### Calculations

| Method | Path | Does |
| --- | --- | --- |
| `POST` | `/api/v1/calculate-mortgage` | Calculate a monthly mortgage payment |
| `POST` | `/api/v1/calculate-amortization` | Build an amortization schedule |
| `POST` | `/api/v1/calculate-pmi` | Calculate mortgage insurance |
| `POST` | `/api/v1/calculate-property-tax` | Estimate property tax |
| `POST` | `/api/v1/calculate-affordability` | Work out how much house someone can afford |
| `POST` | `/api/v1/calculate-refinance` | Evaluate a refinance |
| `POST` | `/api/v1/estimate-closing-costs` | Itemise closing costs |
| `POST` | `/api/v1/calculate-rent-vs-buy` | Compare renting with buying |
| `POST` | `/api/v1/compare-loans` | Compare loan options side by side |
| `POST` | `/api/v1/get-state-mortgage-rules` | Look up a state's property tax rules |
| `POST` | `/api/v1/list-states` | List all 50 states with property tax rates |

All are read-only: they compute from the body you send, store nothing, and are
safe to retry and to cache.

### Reference

| Method | Path | Does |
| --- | --- | --- |
| `GET` | `/api/v1/states` | All 50 states with rate, median value and estimated tax |
| `GET` | `/api/v1/states/{state}` | One state's assessment rules, exemptions and appeal route |
| `GET` | `/api/v1/assumptions` | Every rate, fee and threshold, each with a source and year |
| `GET` | `/api/v1/company` | Publisher details, machine-readable |
| `GET` | `/api/health` | Liveness check |

## The response envelope

**Calculation endpoints wrap the result:**

```json
{ "data": { … }, "meta": { "operation": "…", "computedAt": "…", "disclaimer": "…" } }
```

**Reference endpoints return their object directly** — no wrapper.

This asymmetry catches people out, and it is the single most common integration
bug. Read `response.data.totalMonthlyCost` from a calculation, and
`response.states` from `/api/v1/states`. Every SDK in [`sdk/`](../sdk/) handles it
with one line:

```js
return payload.data ?? payload;
```

## A worked request

```sh
curl -s https://www.usmortgagecalc.com/api/v1/calculate-mortgage \
  -H 'content-type: application/json' \
  -d '{
    "homePrice": 400000,
    "downPaymentPercent": 20,
    "annualInterestRatePercent": 6.5,
    "loanTermYears": 30,
    "state": "Texas"
  }'
```

```json
{
  "data": {
    "monthlyMortgage": 2022.62,
    "monthlyPropertyTax": 603.33,
    "monthlyInsurance": 150,
    "monthlyPmi": 0,
    "monthlyHoa": 0,
    "totalMonthlyCost": 2775.95,

    "loanAmount": 320000,
    "loanType": "conventional",
    "propertyTaxRate": 1.81,
    "state": "Texas",

    "paymentsMade": 360,
    "totalInterestPaid": 408142.36,
    "totalAllPayments": 999342.36,

    "assumptions": {
      "propertyTaxRatePercent": 1.81,
      "propertyTaxSource": "U.S. Census Bureau and Zillow Research",
      "mortgageInsurance": "No conventional PMI estimated because down payment is 20% or more"
    },
    "disclaimer": "Estimate only, from published averages and stated assumptions. …"
  },
  "meta": {
    "operation": "calculate_mortgage",
    "computedAt": "2026-08-14T07:35:56.441Z",
    "disclaimer": "Estimate from published averages. Not a loan offer, rate quote, or financial advice."
  }
}
```

## State, or an explicit rate

Most calculation endpoints need to know the property tax rate, and accept either:

- `"state": "Texas"` — uses that state's average effective rate, and tells you
  which rate it used in `assumptions`; or
- `"propertyTaxRatePercent": 1.81` — your own figure, if you have a better one.

Sending neither is an error. This is a runtime either/or rather than a required
field, so the OpenAPI `required` list does not mention `state` — a detail worth
knowing if you generate a client from the spec, because the generated type will
mark it optional when in practice you need one of the two.

Call `/api/v1/states` for the valid state names.

## Headers

Every response carries:

| Header | Meaning |
| --- | --- |
| `x-ratelimit-limit` | Requests per minute allowed for you |
| `x-ratelimit-remaining` | Left in the current window |
| `x-ratelimit-reset` | Unix seconds when the window resets |
| `x-trace-id` | Correlation id — quote it in a bug report |

CORS is open (`access-control-allow-origin: *`) with `x-trace-id` exposed to
scripts, so the API is callable directly from a browser. Calculation responses
are cacheable at the edge for five minutes.

## Versioning

**The path carries the version.** Breaking changes to a response shape arrive at
`/api/v2`, not by editing v1 underneath you.

**Additive changes happen in place.** New fields may appear in a response. Parse
defensively and ignore what you do not recognise.

**The data moves, the shape does not.** Property tax rates, loan limits and
programme fees are updated as agencies publish them. Every value carries the year
it applies to — check `/api/v1/assumptions` to see what changed.

## See also

- [errors.md](errors.md) — every code the API can return
- [rate-limits.md](rate-limits.md) — including an important caveat about how they are enforced
- [authentication.md](authentication.md) — optional, and what a key actually buys
- [`spec/postman_collection.json`](../spec/postman_collection.json) — every endpoint, ready to run
