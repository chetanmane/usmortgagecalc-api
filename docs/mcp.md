# MCP server

```
https://www.usmortgagecalc.com/mcp
```

| | |
| --- | --- |
| Transport | Streamable HTTP |
| Authentication | None |
| State | Stateless |
| Server name | `com.usmortgagecalc/mortgage` |

A **remote** server: nothing to install, no package, no process to run. Point a
client at the URL.

The machine-readable card is [`spec/mcp-server.json`](../spec/mcp-server.json),
also served live at
[`/.well-known/mcp/server.json`](https://www.usmortgagecalc.com/.well-known/mcp/server.json).

## Connecting

### Claude Code

```sh
claude mcp add --transport http usmortgagecalc https://www.usmortgagecalc.com/mcp
```

Adds it to the current project. `--scope user` makes it available everywhere.

### Claude Desktop

`claude_desktop_config.json` — Settings → Developer → Edit Config. Restart afterwards.

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

### Cursor

`.cursor/mcp.json` for one project, `~/.cursor/mcp.json` for all of them.

```json
{
  "mcpServers": {
    "usmortgagecalc": {
      "url": "https://www.usmortgagecalc.com/mcp"
    }
  }
}
```

### VS Code

`.vscode/mcp.json`. **Note the key is `servers`, not `mcpServers`** — the one
difference that costs people twenty minutes.

```json
{
  "servers": {
    "usmortgagecalc": {
      "type": "http",
      "url": "https://www.usmortgagecalc.com/mcp"
    }
  }
}
```

### Anything else

```sh
npx @modelcontextprotocol/inspector https://www.usmortgagecalc.com/mcp
```

Lists the tools, resources and prompts and lets you call them by hand — the
quickest way to establish that a client problem is not a server problem.

## Tools

Eleven, each a pure function over published data. Every result carries the
assumptions behind it and a disclaimer, so an agent can explain where a figure
came from rather than merely asserting it.

| Tool | Does |
| --- | --- |
| `calculate_mortgage` | Full monthly cost: P&I, tax, insurance, PMI, HOA, plus lifetime totals |
| `calculate_amortization` | Payment-by-payment principal/interest split and falling balance |
| `calculate_pmi` | Mortgage insurance for conventional, FHA, VA and USDA, including upfront charges |
| `calculate_property_tax` | Annual and monthly tax, plus how the state ranks nationally |
| `calculate_affordability` | Maximum price from income and debts, naming the binding ratio |
| `calculate_refinance` | New payment, monthly saving, break-even, and lifetime cost |
| `estimate_closing_costs` | Line-by-line costs and total cash needed at the table |
| `calculate_rent_vs_buy` | Compares on net wealth, not monthly payment; returns the crossover year |
| `compare_loans` | Two to five scenarios, cheapest by payment and by lifetime cost separately |
| `get_state_mortgage_rules` | Assessment basis, caps, exemptions, appeal window for one state |
| `list_states` | All fifty with rates, sortable |

## Resources

| URI | Contains |
| --- | --- |
| `usmc://company/profile` | Publisher and editorial information |
| `usmc://glossary` | Mortgage and property tax terms, acronyms expanded |
| `usmc://states/index` | All fifty states with rates and provenance |
| `usmc://states/{state}` | One state's rules, exemptions and appeal route |
| `usmc://assumptions/rates` | Every rate and fee, with source and year |
| `usmc://legal/disclaimer` | Scope and limits of the estimates |
| `usmc://docs/openapi` | The OpenAPI document, for callers preferring HTTP |

## Prompts

Discoverable prompts that chain the right tools in the right order and carry the
caveats through to the answer.

| Prompt | Does |
| --- | --- |
| `explain_my_payment` | Breaks a payment into parts and says which will rise |
| `compare_fha_vs_conventional` | Weighs both, including long-run mortgage insurance |
| `estimate_closing_costs` | Itemises and separates negotiable from fixed |
| `how_much_can_i_afford` | Derives a range and names the binding constraint |
| `should_i_refinance` | Break-even against lifetime cost, which often disagree |
| `explain_amortization` | Why early payments are mostly interest |
| `first_time_buyer_walkthrough` | Chains affordability, costs, payment and PMI |

## Checking it worked

Ask something the model cannot answer from memory:

> "What would a $450,000 house in New Jersey cost per month at 6.5% with 10% down?"

A real answer cites New Jersey's property tax rate and includes mortgage
insurance, because the tool returns both. If the figures are round and no state
rate appears, the server is not connected and the model is guessing.

## Protocol notes

**`Accept` is mandatory.** Streamable HTTP requires clients to accept both
content types. A request without it is correctly refused with `406`:

```sh
curl -s https://www.usmortgagecalc.com/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Omitting it is a common cause of "the server is down" reports when the server is
fine.

**Stateless.** There is no session to establish and no state carried between
calls. Each request stands alone, which is why the server can be called from
anywhere without a handshake.

**Responses are SSE frames**, not bare JSON, when the transport chooses to stream.
Parse accordingly, or let your MCP client do it.

## Rate limits and privacy

The same [rate limits](rate-limits.md) apply as to the REST API. No mortgage
inputs, prompts or tool arguments are recorded — see the
[privacy position](https://www.usmortgagecalc.com/privacy).
