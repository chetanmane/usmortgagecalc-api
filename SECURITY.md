# Security policy

## Reporting a vulnerability

Email **devscriptify@gmail.com** with `SECURITY` in the subject. Please do not
open a public issue for anything exploitable.

Include what makes it reproducible: the endpoint, a request that triggers it, and
what you observed versus expected. A `curl` command is ideal. Quote the
`x-trace-id` header if you have one.

Acknowledgement within 3 business days. If a fix is warranted you will be told
when it ships, and credited unless you would rather not be.

## Scope

**In scope — the live platform:**

- `https://www.usmortgagecalc.com` and the REST API under `/api/v1/`
- The MCP server at `https://www.usmortgagecalc.com/mcp`
- The embeddable widget at `/embed.js` and `/embed/*`

**In scope — this repository:**

- An SDK or example that mishandles a key, e.g. logging it or putting it in a URL
- A build or verification script that could execute untrusted input
- Documentation that recommends an insecure integration pattern

**Out of scope:**

- Third-party services the site loads (Google AdSense, Google Analytics) — report
  to the vendor
- Missing hardening headers with no demonstrated impact
- Volumetric denial of service. The API is free and rate limited; please do not
  test limits by exhausting them
- Automated scanner output without a working proof of concept

## What this service holds

Worth knowing before you look, because it shapes what an interesting finding is:

- **No user accounts and no personal data.** The calculators run on figures you
  type and store none of them. No login, no session.
- **No mortgage inputs in telemetry.** Not hashed, not sampled.
- **IP addresses are not stored** — only a salted, daily-rotated hash that
  answers "same caller twice today" and not "who".
- **API keys are hashed** with a server-side salt and shown once at creation. A
  key raises a rate limit; it never grants access.

The developer dashboard is an explicit preview: the account is whatever
identifier you type, and the page says so. That is a stated limitation rather
than a vulnerability — but reading or revoking keys belonging to an account you
did not name **is** a finding, and we want it.

## Safe harbour

We will not pursue or support legal action against research that respects this
policy: no privacy violations, no data destruction, no service degradation, and
no accessing an account or data that is not yours. Test against your own inputs.
If unsure whether something is in bounds, ask first.
