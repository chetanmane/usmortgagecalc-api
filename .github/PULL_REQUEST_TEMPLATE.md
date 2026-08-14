# What this changes

<!-- What is different afterwards, and why it needed to be. -->

## Checklist

- [ ] `npm run verify` passes
- [ ] I did not hand-edit `spec/*.json` — those are mirrors of what the platform
      publishes, refreshed with `npm run sync`

## If you added or changed an SDK or example

- [ ] Handles the `{ data, meta }` envelope on calculation endpoints
- [ ] Reads `error.code` and `error.issues[]` — **not** `error.type` / `error.field`
- [ ] Sends `USMC_API_KEY` as a bearer token when set, and works without it
- [ ] States below whether you **ran** it or only checked it against the contract

Ran it against production: <!-- yes / no — and with what toolchain version -->

## If you changed documentation

- [ ] Every claim is checked against the live API, not against another doc
- [ ] Code blocks were copy-pasted and run, not written from memory
