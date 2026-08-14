/**
 * Generates the Postman collection from spec/openapi.json.
 *
 *   node scripts/build-postman.mjs
 *
 * Generated rather than hand-maintained for the same reason the OpenAPI document
 * exists at all: a hand-written collection drifts from the API the first time an
 * endpoint changes, and a collection that 404s is worse than none. Regenerate it
 * whenever the spec is synced.
 *
 * Example request bodies come from each schema's own defaults and examples, so
 * every request in the collection is one that actually validates.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const spec = JSON.parse(readFileSync(join(root, "spec", "openapi.json"), "utf8"));
const baseUrl = spec.servers?.[0]?.url ?? "https://www.usmortgagecalc.com";

/**
 * A plausible value for one property.
 *
 * Prefers what the schema itself states — an example, a default, the first enum
 * member — and only invents when the schema offers nothing, so the generated
 * request bodies stay valid as the schemas change.
 */
const sampleFor = (name, schema) => {
  if (!schema || typeof schema !== "object") return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  if (type === "string") {
    if (/state/i.test(name)) return "Texas";
    return schema.minLength ? "x".repeat(schema.minLength) : "example";
  }
  if (type === "integer" || type === "number") {
    if (schema.minimum !== undefined) return schema.minimum || 1;
    if (/price|value|amount|income|balance|cost/i.test(name)) return 400_000;
    if (/percent|rate/i.test(name)) return 6.5;
    if (/years|term/i.test(name)) return 30;
    return 1;
  }
  if (type === "boolean") return false;
  if (type === "array") {
    const item = sampleFor(name, schema.items);
    if (item === null) return [];
    // minItems is load-bearing: compare-loans rejects fewer than two scenarios,
    // and a one-element array made the generated request 400.
    const count = Math.max(schema.minItems ?? 1, 1);
    return Array.from({ length: count }, () => item);
  }
  if (type === "object" || schema.properties) return buildBody(schema);

  return null;
};

/** Builds an example body containing every required property, and nothing else. */
const buildBody = (schema) => {
  if (!schema?.properties) return {};

  const required = new Set(schema.required ?? []);
  const body = {};

  for (const [name, property] of Object.entries(schema.properties)) {
    /*
     * `state` is required in practice but not in `required`: the engine accepts
     * either a state name or an explicit propertyTaxRatePercent, and JSON Schema
     * expresses that as a runtime either/or rather than a required field. Six
     * generated requests 400'd on "Either `state` or `propertyTaxRatePercent` is
     * required" until this case was added.
     */
    const conditionallyRequired = name === "state";

    // Otherwise: required fields always; optional ones only when the schema
    // supplies a concrete example or default, so the collection does not imply
    // that an invented optional value is meaningful.
    const stated = property.example !== undefined || property.default !== undefined;
    if (!required.has(name) && !conditionallyRequired && !stated) continue;

    const value = sampleFor(name, property);
    if (value !== null) body[name] = value;
  }

  return body;
};

const items = [];

/** Collection variables for OpenAPI path parameters, e.g. `{state}`. */
const pathVariables = new Map([["state", "texas"]]);

/**
 * `/api/v1/states/{state}` -> `/api/v1/states/{{state}}`.
 *
 * OpenAPI's single braces are literal characters to Postman, so the request was
 * sent to a path containing "{state}" and 404'd. Doubling them makes it a real
 * variable the user can edit once for the whole collection.
 */
const toPostmanPath = (path) => path.replace(/\{([^}]+)\}/g, "{{$1}}");

for (const [path, operations] of Object.entries(spec.paths)) {
  for (const [method, operation] of Object.entries(operations)) {
    const schema = operation.requestBody?.content?.["application/json"]?.schema;
    const postmanPath = toPostmanPath(path);

    for (const match of path.matchAll(/\{([^}]+)\}/g)) {
      if (!pathVariables.has(match[1])) pathVariables.set(match[1], "");
    }

    const request = {
      method: method.toUpperCase(),
      header: [{ key: "content-type", value: "application/json" }],
      url: {
        raw: `{{baseUrl}}${postmanPath}`,
        host: ["{{baseUrl}}"],
        path: postmanPath.replace(/^\//, "").split("/"),
      },
      description: operation.description ?? operation.summary ?? "",
    };

    if (schema) {
      request.body = {
        mode: "raw",
        raw: JSON.stringify(buildBody(schema), null, 2),
        options: { raw: { language: "json" } },
      };
    }

    items.push({
      name: operation.summary ?? operation.operationId ?? `${method.toUpperCase()} ${path}`,
      request,
      response: [],
    });
  }
}

const collection = {
  info: {
    name: "US Mortgage Calculator API",
    description:
      "Mortgage calculations for all fifty US states. Free, no authentication required — " +
      "an API key raises your rate limit rather than granting access.\n\n" +
      "Set `apiKey` in the collection variables to send one; leave it empty to call anonymously.\n\n" +
      "Generated from spec/openapi.json — do not edit by hand.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: baseUrl, type: "string" },
    { key: "apiKey", value: "", type: "string" },
    ...[...pathVariables].map(([key, value]) => ({ key, value, type: "string" })),
  ],
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{apiKey}}", type: "string" }],
  },
  item: items.sort((a, b) => a.name.localeCompare(b.name)),
};

const out = join(root, "spec", "postman_collection.json");
writeFileSync(out, `${JSON.stringify(collection, null, 2)}\n`);

console.log(`Wrote ${items.length} requests to spec/postman_collection.json`);
