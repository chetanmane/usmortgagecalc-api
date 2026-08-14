/**
 * Verifies this repository against the live platform.
 *
 *   node scripts/verify.mjs
 *
 * Exits non-zero on any failure, so CI can gate on it.
 *
 * ## Why this exists
 *
 * Everything here is a mirror of something the platform publishes. Mirrors go
 * stale silently: the spec drifts, an SDK binds to a renamed field, a Postman
 * request starts 400ing, and nothing tells you until a developer opens an issue
 * saying the documentation is wrong.
 *
 * So nothing in this repository asks to be trusted. Every spec is diffed against
 * what production serves right now, and every request in the collection is
 * actually sent.
 *
 * This has already paid for itself twice: six generated Postman bodies 400'd on
 * a conditional either/or the OpenAPI `required` list does not express, and all
 * six SDKs bound to `error.type` when the API returns `error.code`.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const BASE = process.argv[2] ?? "https://www.usmortgagecalc.com";

const LOAN = {
  homePrice: 400000,
  downPaymentPercent: 20,
  annualInterestRatePercent: 6.5,
  loanTermYears: 30,
  state: "Texas",
};
const EXPECTED_MONTHLY = 2775.95;

let passes = 0;
let failures = 0;
let throttled = 0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const record = (ok, label, detail = "") => {
  if (ok) passes += 1;
  else failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label.padEnd(48)}${detail}`);
};

const check = async (label, fn) => {
  try {
    record(true, label, (await fn()) ?? "");
  } catch (error) {
    record(false, label, error instanceof Error ? error.message : String(error));
  }
};

const expect = (condition, message) => {
  if (!condition) throw new Error(message);
};

/**
 * A 403 is the platform throttling a burst, never an answer from this API.
 * Retry rather than reporting a failure the service did not cause.
 */
const request = async (url, init) => {
  for (let attempt = 0; ; attempt += 1) {
    await wait(150);
    const response = await fetch(url, { cache: "no-store", ...init });
    if (response.status !== 403) return response;
    throttled += 1;
    if (attempt >= 2) return response;
    await wait(5_000 * (attempt + 1));
  }
};

const local = (file) => JSON.parse(readFileSync(join(root, file), "utf8"));

console.log(`\nVerifying against ${BASE}\n${"-".repeat(72)}`);

/* --------------------------------------------------------------- the API */

await check("API returns the known answer", async () => {
  const response = await request(`${BASE}/api/v1/calculate-mortgage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(LOAN),
  });
  expect(response.ok, `HTTP ${response.status}`);
  const { data } = await response.json();
  expect(
    Math.abs(data.totalMonthlyCost - EXPECTED_MONTHLY) < 0.01,
    `expected ${EXPECTED_MONTHLY}, got ${data.totalMonthlyCost}`,
  );
  return `$${data.totalMonthlyCost}`;
});

/* ------------------------------------------------------------ spec drift */

await check("spec/openapi.json matches production", async () => {
  const response = await request(`${BASE}/openapi.json`);
  expect(response.ok, `HTTP ${response.status}`);
  const live = await response.json();
  const mine = local("spec/openapi.json");

  const livePaths = Object.keys(live.paths).sort();
  const minePaths = Object.keys(mine.paths).sort();

  const missing = livePaths.filter((p) => !minePaths.includes(p));
  const extra = minePaths.filter((p) => !livePaths.includes(p));

  expect(!missing.length, `spec is stale — production added: ${missing.join(", ")}`);
  expect(!extra.length, `spec is stale — production removed: ${extra.join(", ")}`);
  expect(live.openapi === mine.openapi, `version drift: ${mine.openapi} vs ${live.openapi}`);

  return `${minePaths.length} paths, in step`;
});

await check("spec/mcp-server.json matches production", async () => {
  const response = await request(`${BASE}/.well-known/mcp/server.json`);
  expect(response.ok, `HTTP ${response.status}`);
  const live = await response.json();
  const mine = local("spec/mcp-server.json");

  expect(live.name === mine.name, `name drift: ${mine.name} vs ${live.name}`);
  expect(live.version === mine.version, `version drift: ${mine.version} vs ${live.version}`);

  const liveTools = live.capabilities.tools.map((t) => t.name).sort();
  const mineTools = mine.capabilities.tools.map((t) => t.name).sort();
  expect(
    JSON.stringify(liveTools) === JSON.stringify(mineTools),
    `tool list drift: ${mineTools.length} here vs ${liveTools.length} live`,
  );

  return `${mineTools.length} tools, in step`;
});

/* ----------------------------------------------------- postman collection */

await check("every Postman request succeeds", async () => {
  const collection = local("spec/postman_collection.json");
  const vars = Object.fromEntries(collection.variable.map((v) => [v.key, v.value]));
  const resolve = (raw) =>
    raw.replace(/\{\{(\w+)\}\}/g, (_, key) => (key === "baseUrl" ? BASE : vars[key] ?? ""));

  const broken = [];
  for (const item of collection.item) {
    const url = resolve(item.request.url.raw);
    const init =
      item.request.method === "POST"
        ? {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: item.request.body.raw,
          }
        : undefined;

    const response = await request(url, init);
    if (!response.ok) broken.push(`${item.name} → ${response.status}`);
  }

  expect(!broken.length, broken.join("; "));
  return `${collection.item.length} requests`;
});

/* -------------------------------------------------------------------- MCP */

await check("MCP tools/list returns the calculator", async () => {
  const response = await request(`${BASE}/mcp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
  expect(response.ok, `HTTP ${response.status}`);
  const text = await response.text();
  expect(text.includes("calculate_mortgage"), "calculate_mortgage missing");
  return "present";
});

await check("MCP refuses a request without Accept", async () => {
  const response = await request(`${BASE}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
  expect(response.status === 406, `expected 406, got ${response.status}`);
  return "406, per the spec";
});

/* --------------------------------------------------- documented contracts */

await check("error shape is code/message/issues, as documented", async () => {
  const response = await request(`${BASE}/api/v1/calculate-mortgage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ homePrice: -1 }),
  });
  expect(response.status === 400, `expected 400, got ${response.status}`);
  const { error } = await response.json();
  expect(error.code, "no `code` — docs and every SDK read this field");
  expect(Array.isArray(error.issues), "no `issues[]` array");
  expect(error.type === undefined, "`type` reappeared; docs say `code`");
  return `${error.code}, ${error.issues.length} issue(s)`;
});

await check("rate limit headers are present, as documented", async () => {
  const response = await request(`${BASE}/api/v1/states`);
  for (const header of ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"]) {
    expect(response.headers.get(header), `missing ${header}`);
  }
  expect(response.headers.get("x-trace-id"), "missing x-trace-id");
  return `limit ${response.headers.get("x-ratelimit-limit")}`;
});

await check("datasets referenced by the docs exist", async () => {
  const response = await request(`${BASE}/datasets/index.json`);
  expect(response.ok, `HTTP ${response.status}`);
  const index = await response.json();
  expect(index.datasets?.length > 0, "dataset index is empty");
  for (const dataset of index.datasets) {
    const csv = await request(dataset.csv, { method: "HEAD" });
    expect(csv.ok, `${dataset.id} CSV → ${csv.status}`);
  }
  return `${index.datasets.length} datasets`;
});

/* ------------------------------------------------------------------- SDKs */

await check("JavaScript SDK runs against production", async () => {
  const { execFileSync } = await import("node:child_process");
  const out = execFileSync(process.execPath, [join(root, "sdk", "javascript", "mortgage.js")], {
    encoding: "utf8",
    timeout: 30_000,
  });
  expect(out.includes("2775.95") || out.includes("2,775.95"), `unexpected output: ${out.trim()}`);
  return out.trim().split("\n")[0];
});

/* ---------------------------------------------------------------- verdict */

console.log("-".repeat(72));
console.log(`${passes} passed, ${failures} failed`);

if (throttled > 2 && failures > 0) {
  console.log(
    `\n${throttled} responses were HTTP 403 — platform bot protection refusing\n` +
      "this burst, not a fault in the service. Wait a minute and re-run.\n",
  );
  process.exit(2);
}

console.log();
process.exit(failures === 0 ? 0 : 1);
