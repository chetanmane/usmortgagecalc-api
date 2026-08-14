/**
 * Pulls the current specifications from production into spec/.
 *
 *   node scripts/sync-specs.mjs
 *
 * The generators live in the private repository — the OpenAPI document is built
 * from the same schemas the endpoints validate against, and the MCP card from
 * the live tool catalogue. Copying the published artifacts is therefore the only
 * correct way to update them here; hand-editing a file in spec/ would make this
 * repository disagree with the service it documents.
 *
 * Run this after a platform release, then `node scripts/verify.mjs`, then commit.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const BASE = process.argv[2] ?? "https://www.usmortgagecalc.com";

const artifacts = [
  { url: `${BASE}/openapi.json`, file: "spec/openapi.json" },
  { url: `${BASE}/.well-known/mcp/server.json`, file: "spec/mcp-server.json" },
];

for (const { url, file } of artifacts) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} → HTTP ${response.status}`);

  const body = await response.json();
  writeFileSync(join(root, file), `${JSON.stringify(body, null, 2)}\n`);
  console.log(`Synced ${file}`);
}

// The collection is derived from the spec, so it must be rebuilt whenever the
// spec moves — otherwise a synced endpoint has no request behind it.
execFileSync(process.execPath, [join(here, "build-postman.mjs")], { stdio: "inherit" });

console.log("\nNow run: node scripts/verify.mjs");
