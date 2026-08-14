/**
 * Generates OpenAI-style function definitions from the published OpenAPI
 * document, for agent frameworks that do not speak MCP.
 *
 *   node examples/agent-tools/generate-tools.mjs > tools.json
 *
 * Reading the spec rather than hand-writing the definitions means a field added
 * to an endpoint appears in your tools automatically, and one removed
 * disappears — which is the whole reason to publish a machine-readable spec.
 */

const SPEC = "https://www.usmortgagecalc.com/openapi.json";

const spec = await fetch(SPEC).then((response) => {
  if (!response.ok) throw new Error(`Could not fetch the spec: HTTP ${response.status}`);
  return response.json();
});

/** OpenAPI path -> a function name an agent framework will accept. */
const functionName = (path) =>
  path.replace(/^\/api\/v1\//, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");

/**
 * Resolves a local $ref. The spec keeps request bodies in components, and most
 * frameworks will not follow a reference for you.
 */
const deref = (node, seen = new Set()) => {
  if (!node || typeof node !== "object") return node;

  if (typeof node.$ref === "string") {
    if (seen.has(node.$ref)) return {};
    seen.add(node.$ref);
    const target = node.$ref
      .replace(/^#\//, "")
      .split("/")
      .reduce((current, key) => current?.[key], spec);
    return deref(target, seen);
  }

  if (Array.isArray(node)) return node.map((item) => deref(item, seen));

  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, deref(value, seen)]));
};

const tools = [];

for (const [path, methods] of Object.entries(spec.paths ?? {})) {
  const operation = methods.post;
  if (!operation) continue;

  const schema = deref(operation.requestBody?.content?.["application/json"]?.schema);
  if (!schema) continue;

  tools.push({
    type: "function",
    function: {
      name: functionName(path),
      description: operation.description ?? operation.summary ?? "",
      parameters: schema,
    },
  });
}

if (tools.length === 0) {
  throw new Error("No POST operations found — the specification format may have changed.");
}

console.error(`Generated ${tools.length} tool definitions from ${SPEC}`);
console.log(JSON.stringify(tools, null, 2));
