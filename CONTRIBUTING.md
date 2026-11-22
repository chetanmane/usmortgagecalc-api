# Contributing

This repository is the developer-facing half of a platform whose server is
closed source. That shapes what contributions look like, so it is worth being
direct about it up front.

## What lives here, and what does not

**Here:** documentation, specifications, SDKs, examples, and the tooling that
keeps them honest.

**Not here:** the calculation engine, the website, the REST and MCP server
implementations, telemetry, the developer platform, and infrastructure. Those
are proprietary.

A consequence worth stating plainly: **a pull request cannot change what the API
returns.** It can change how that behaviour is described, how easy it is to call,
and whether the mismatch is caught. Those are the contributions this repository
exists for.

## Getting set up

Node 20 or newer. There is nothing to build.

```sh
git clone https://github.com/chetanmane/usmortgagecalc-api.git
cd usmortgagecalc-api
npm run verify        # checks everything here against the live API
```

No environment variables, no key, no account. `verify` calls production over the
public internet, so it needs a network connection and nothing else.

## Before opening a pull request

```sh
npm run verify
```

This must pass. It sends every request in the Postman collection, diffs both
specs against what production serves, runs the JavaScript SDK, and asserts the
error shape and headers that the docs promise.

If you changed `spec/openapi.json` by hand, expect it to fail — see below.

## The specs are mirrors, not sources

`spec/openapi.json` and `spec/mcp-server.json` are artifacts published by the
platform. The OpenAPI document is generated from the same schemas the endpoints
validate against; the MCP card from the live tool catalogue.

**Do not hand-edit them.** A spec edited here would make this repository
disagree with the service it documents, which is worse than being out of date,
because it looks authoritative. To refresh:

```sh
npm run sync          # pull current specs, rebuild the Postman collection
npm run verify
```

The Postman collection is generated too — edit `scripts/build-postman.mjs`, not
the JSON.

## Refreshing the data

When the platform refreshes its ACS dataset, the worked example changes with it.
Update these together, or the nightly Verify run goes red:

- `EXPECTED_MONTHLY` in `scripts/verify.mjs`
- the worked examples in `README.md` and `docs/` (`quickstart.md`, `rest-api.md`):
  total monthly cost, monthly property tax, property tax rate and
  `totalAllPayments`

Take the figures from a live response, not from arithmetic, then run
`npm run sync` and `npm run verify`.

## Especially welcome

**Documentation gaps.** If you had to read the spec, experiment, or guess to get
something working, that is a bug here. Say what you were trying to do and where
you got stuck; that is more useful than a proposed wording.

**A doc that is wrong.** The most valuable reports. These docs have shipped
`error.type` when the API returns `error.code`, and examples that printed
`undefined` because they read the result off the wrong level of the envelope. If
something here does not match reality, it is a real defect — please open an
issue rather than working around it silently.

**A new SDK language.** Rust, Ruby, Java, Kotlin, Swift are all missing. Follow
the existing shape: one file, no dependencies, handles the `{ data, meta }`
envelope and the `code`/`issues[]` error shape, reads `USMC_API_KEY` if set.
State in the PR whether you actually ran it, and against what.

**Integration examples** for frameworks and agent platforms not covered.

## Two contracts every example must handle

These are where integrations break, and where the existing examples have broken:

**The response envelope.** Calculation endpoints wrap as `{ data, meta }`;
reference endpoints return their object directly. One line handles both:

```js
return payload.data ?? payload;
```

**The error shape.** The key is `code`, not `type`, and offending fields arrive
in `issues[]`, not `field`. Reading the wrong name yields `undefined` silently
rather than throwing, which is exactly how all six SDKs here were wrong at once.

## Reporting a service bug

Wrong numbers and failing endpoints belong here, even though the fix does not.
Use the [incorrect calculation template](.github/ISSUE_TEMPLATE/calculation_error.yml)
for a wrong figure — it asks for the exact inputs, without which nothing can be
reproduced. Include the `x-trace-id` header for anything else.

The fix lands in the private repository; you will be told in the issue when it
ships, and the docs here are updated in the same pass.

Security issues follow [SECURITY.md](SECURITY.md) and never a public issue.

## Style

Match the surrounding code and prose. Two conventions that are deliberate:

- **Comments and docs explain why, not what.** A line that needs a comment to say
  what it does usually needs a better name instead. The comments worth writing
  record a constraint, a tradeoff, or the bug that motivated the code.
- **Do not invent numbers.** If a figure cannot be measured or sourced, say
  `Unknown`. The platform reports its own uptime as unknown rather than guessing,
  and documentation held to a lower standard than that is not worth having.

## Commit messages

A subject line saying what changed, then a body explaining why it needed to.
Reference behaviour, not the file list — the diff already lists the files.
