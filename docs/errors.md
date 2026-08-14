# Errors

One shape, always:

```json
{
  "error": {
    "code": "invalid_input",
    "message": "Invalid arguments for calculate_mortgage: homePrice — Too small: expected number to be >0",
    "issues": [
      { "field": "homePrice", "message": "Too small: expected number to be >0" }
    ],
    "documentation": "https://www.usmortgagecalc.com/openapi.json"
  }
}
```

**The key is `code`, not `type`, and offending fields arrive in `issues[]` rather
than a single `field`.** Both names are easy to guess wrong, and guessing wrong
fails silently — you get `undefined` rather than an exception. Every SDK in this
repository bound to the wrong two names until they were checked against a live
error response.

## Codes

| Status | `code` | When |
| ---: | --- | --- |
| 400 | `invalid_input` | A field failed schema validation. `issues[]` names each one. |
| 400 | `invalid_json` | The body was not parseable JSON. |
| 401 | `unauthorized` | An admin or developer route without valid credentials. |
| 404 | `not_found` | No endpoint matches that path. |
| 404 | `unknown_state` | Not one of the fifty. Call `/api/v1/states` for valid names. |
| 405 | `method_not_allowed` | Calculations are `POST`; reference endpoints are `GET`. |
| 429 | `rate_limited` | Too many requests. See [rate-limits.md](rate-limits.md). |
| 500 | `calculation_failed` | The engine threw. This is a bug — please report it. |

## Handling them

```js
const response = await fetch(url, { method: "POST", headers, body });
const payload = await response.json();

if (!response.ok) {
  const { code, message, issues } = payload.error ?? {};
  const fields = issues?.map((issue) => issue.field).join(", ");
  throw new Error(`${code ?? response.status}: ${message}${fields ? ` (${fields})` : ""}`);
}

const result = payload.data ?? payload;
```

## Validation happens before the engine

Input is checked against a schema before it reaches any calculation, so an
invalid request fails naming the field rather than returning a plausible-looking
number computed from a coerced value. A missing rate is not a 0% rate, and the
API will not pretend otherwise.

That is why `"homePrice": "400000"` as a string is rejected rather than quietly
parsed: a caller who is sending strings is usually about to send `""` for
something, and a silent 0 in a mortgage calculation is worse than an error.

## Retrying

| Code | Retry? |
| --- | --- |
| `rate_limited` | Yes, after `Retry-After` seconds |
| `calculation_failed` | Once, then report it |
| Everything else | No — fix the request |

Calculation endpoints are pure functions over your input. They store nothing, so
retrying is always safe and never double-counts.

## Reporting a bug

Quote the `x-trace-id` header from the failing response. It identifies the exact
request. For a wrong *number* rather than an error, include the full request body
and the figure you expected — see the
[incorrect calculation issue template](../.github/ISSUE_TEMPLATE/calculation_error.yml).
