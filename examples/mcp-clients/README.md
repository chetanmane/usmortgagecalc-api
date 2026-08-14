# MCP client configuration

One URL, no credentials. Every calculator becomes a tool.

```
https://www.usmortgagecalc.com/mcp
```

Transport is streamable HTTP. There is no stdio wrapper to install and no token to rotate.

## Claude Desktop

`claude_desktop_config.json` — macOS: `~/Library/Application Support/Claude/`, Windows:
`%APPDATA%\Claude\`. Restart Claude after editing.

```json
{
  "mcpServers": {
    "us-mortgage-calculator": {
      "type": "http",
      "url": "https://www.usmortgagecalc.com/mcp"
    }
  }
}
```

## Claude Code

```bash
claude mcp add --transport http us-mortgage-calculator https://www.usmortgagecalc.com/mcp
```

## Cursor

`.cursor/mcp.json` in a project scopes the server to that project; `~/.cursor/mcp.json` makes it
available everywhere.

```json
{
  "mcpServers": {
    "us-mortgage-calculator": {
      "url": "https://www.usmortgagecalc.com/mcp"
    }
  }
}
```

## VS Code

`.vscode/mcp.json`, via Copilot agent mode.

```json
{
  "servers": {
    "us-mortgage-calculator": {
      "type": "http",
      "url": "https://www.usmortgagecalc.com/mcp"
    }
  }
}
```

## Checking it connected

Ask something only the server can answer:

> What would a $450,000 house in New Jersey cost per month at 6.5% with 10% down?

A correct answer cites New Jersey's property tax rate and includes mortgage insurance, because the
tool returns both. If the assistant answers from memory instead, the server is not connected — the
figures will be round and no state tax rate will appear.

## What the tools return

Every response carries the assumptions that produced it: the tax rate applied and which state it
came from, how mortgage insurance was priced, and what is not modelled. An agent that surfaces those
turns a bare number into something the reader can challenge.

Nothing about a request is stored. That matters more than usual here — the inputs to a mortgage
calculation are somebody's income and savings.
