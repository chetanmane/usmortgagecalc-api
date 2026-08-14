# SDKs

One file per language. No dependencies, no package to install, nothing to keep
updated.

| Language | File | Run it |
| --- | --- | --- |
| JavaScript | [`javascript/mortgage.js`](javascript/mortgage.js) | `node sdk/javascript/mortgage.js` |
| TypeScript | [`typescript/mortgage.ts`](typescript/mortgage.ts) | `npx tsx sdk/typescript/mortgage.ts` |
| Python | [`python/mortgage.py`](python/mortgage.py) | `pip install httpx && python sdk/python/mortgage.py` |
| Go | [`go/mortgage.go`](go/mortgage.go) | `go run sdk/go/mortgage.go` |
| PHP | [`php/mortgage.php`](php/mortgage.php) | `php sdk/php/mortgage.php` |
| C# | [`csharp/Mortgage.cs`](csharp/Mortgage.cs) | Copy into a `dotnet new console` project as `Program.cs` |

There is no published package for any of these, deliberately. The API is one
POST; a dependency you have to track, audit and upgrade is a poor trade for
eighty lines you can read in full.

**Copy the file into your project and edit it.** That is the intended use.

## What each one handles

**The response envelope.** Calculation endpoints wrap as `{ data, meta }`;
reference endpoints return their object directly. One line covers both:

```js
return payload.data ?? payload;
```

**The error shape.** The key is `code`, not `type`, and offending fields arrive
in `issues[]`, not `field`:

```json
{
  "error": {
    "code": "invalid_input",
    "message": "…",
    "issues": [{ "field": "homePrice", "message": "Too small: expected number to be >0" }]
  }
}
```

Both wrong names are easy to guess and fail *silently* — you get `undefined`
rather than an exception. Every example here bound to `error.type` until it was
checked against a live error response, so this is a mistake worth inheriting the
fix for rather than repeating.

**An optional API key.** Set `USMC_API_KEY` and each example sends it as a
bearer token. Without one, everything still works at the anonymous rate limit —
see [authentication.md](../docs/authentication.md).

## Verification

`npm run verify` runs the JavaScript SDK against production on every push. CI
additionally compiles and runs all six, which is where the Go, PHP and C#
versions get exercised — none of those toolchains is available in the authoring
environment, so their status there is contract-verified only.

"Contract verified" means every JSON field the example binds to was checked
against a live response and exists. That covers the likeliest failure — a
renamed or mis-cased field — and does not cover a compile error.

That distinction earned its keep: contract verification had only ever been run
against a *success* response, so the error path was unchecked in all six
languages simultaneously.

## Typed clients

For full type coverage, generate rather than hand-write:

```sh
npx openapi-typescript spec/openapi.json -o api.d.ts
```

One caveat: `state` will be typed as optional because it is required at runtime
via an either/or with `propertyTaxRatePercent`, which JSON Schema's `required`
list cannot express. Send one of the two.

## Adding a language

Rust, Ruby, Java, Kotlin and Swift are all missing and welcome. Follow the shape
above and say in the PR whether you actually ran it. See
[CONTRIBUTING.md](../CONTRIBUTING.md).
