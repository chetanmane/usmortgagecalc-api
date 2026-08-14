# Examples

Integration patterns beyond a single API call. For plain request/response code,
see [`sdk/`](../sdk/).

| Directory | What it shows |
| --- | --- |
| [`mcp-clients/`](mcp-clients/) | Connecting Claude, Cursor, VS Code and other MCP clients |
| [`agent-tools/`](agent-tools/) | Generating OpenAI-style function definitions from the OpenAPI spec |
| [`embed/`](embed/) | React, Next.js, Vue and Angular components wrapping the widget |
| [`github-actions/`](github-actions/) | A workflow that opens an issue when published assumptions change |
| [`rest-node/`](rest-node/) | Calling several endpoints and combining the results |
| [`rest-python/`](rest-python/) | The same, in Python |

## Two worth knowing about

**[`agent-tools/generate-tools.mjs`](agent-tools/generate-tools.mjs)** builds
tool definitions by reading the published OpenAPI document rather than
hand-writing them, so a field added to an endpoint appears in your agent's tools
automatically and one removed disappears. That is the whole reason to publish a
machine-readable spec.

```sh
node examples/agent-tools/generate-tools.mjs > tools.json
```

**[`github-actions/watch-assumptions.yml`](github-actions/watch-assumptions.yml)**
polls `/api/v1/assumptions` on a schedule and opens an issue when a rate, fee or
threshold changes. Better than polling from your application: rates move a few
times a year, and every value carries the year it applies to, so a diff tells you
exactly what moved.

## Full embedding guide

The framework components here cover mounting the widget. Plain HTML, iframes,
presetting fields, WordPress, Squarespace, Wix, Webflow and the attribution terms
are in [`docs/embed.md`](../docs/embed.md).
