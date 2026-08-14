# Authentication

**There is none, and that is deliberate.** Every calculation and reference
endpoint works with no credentials at all. If you only need the numbers, you can
stop reading here.

```sh
curl -s https://www.usmortgagecalc.com/api/v1/calculate-mortgage \
  -H 'content-type: application/json' \
  -d '{"homePrice":400000,"downPaymentPercent":20,
       "annualInterestRatePercent":6.5,"loanTermYears":30,"state":"Texas"}'
```

No key. No signup. No `Authorization` header.

## What a key is for

A key **raises your rate limit and gives you your own bucket**. It does not
unlock endpoints, fields, or precision — there is no paid tier of the answer.

| Without a key | With a key |
| --- | --- |
| 120 requests/minute | 120 (free) or 1,200 (pro) |
| Bucketed by IP, shared with everyone behind it | Your own bucket |
| No usage visibility | Per-day usage in the dashboard |

Get one at [usmortgagecalc.com/dashboard](https://www.usmortgagecalc.com/dashboard).

## Using it

Send it as a bearer token:

```sh
curl -s https://www.usmortgagecalc.com/api/v1/calculate-mortgage \
  -H 'authorization: Bearer usmc_live_…' \
  -H 'content-type: application/json' \
  -d '{"homePrice":400000,"downPaymentPercent":20,
       "annualInterestRatePercent":6.5,"loanTermYears":30,"state":"Texas"}'
```

Every SDK in [`sdk/`](../sdk/) reads `USMC_API_KEY` from the environment and
sends it if present:

```sh
export USMC_API_KEY=usmc_live_…
node sdk/javascript/mortgage.js
```

## An expired key degrades, it does not break

An invalid or revoked key is **not an error**. The request succeeds at the
anonymous limit rather than failing.

This is the right way round for a free API: a key that lapses costs you
throughput, not your integration. It also means you never need a code path for
"key rejected" — only for "slower than I expected".

## Keys are shown once

A key is displayed at creation and stored only as a salted hash. It cannot be
retrieved afterwards. If you lose it, revoke it and make another; there is no
recovery flow and no support request that can produce it.

## Handling keys sensibly

- **Never commit one.** They start `usmc_live_` and are easy to grep for.
- **Never put one in browser code.** The API allows CORS from any origin
  precisely so you can call it from a browser *without* a key — anonymous is the
  correct choice there. A key in client-side JavaScript is a key you have given
  away.
- **Use one key per application**, so revoking one does not take down the others.
- **Rotate by creating the new key first**, deploying, then revoking the old one.

## MCP

The MCP server at `/mcp` takes no authentication of any kind and has no key
concept. See [mcp.md](mcp.md).
