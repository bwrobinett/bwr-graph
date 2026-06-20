import jsonld from "jsonld";
import type {
  GraphNode,
  GraphDocument,
  JsonLdContext,
  ContextEntry,
  NodePropertyValue,
  JsonValue,
} from "../graph/types";
import { stripIdTypeAliases } from "../graph/context";
import { graphDocument } from "../graph/document";

// A JSON-LD document, in any of compact, expanded, or flattened form.
export type JsonLdDocument =
  | Record<string, unknown>
  | Array<Record<string, unknown>>;

export interface ImportResult {
  context: JsonLdContext;
  nodes: GraphNode[];
}

// Import a JSON-LD doc into our flat-graph shape. Uses jsonld.flatten with a
// derived context (input @context minus any @id/@type keyword aliases) so the
// flattener emits literal `@id`/`@type` rather than alias keys, then walks
// each node:
//   - @id  → id
//   - @type → type (single string; arrays collapse to their first entry)
//   - declared @id properties: bare strings or [string, ...] become link arrays
//   - {"@id": "..."} value objects also become links
//   - {"@value": x} value objects unwrap to x
//   - everything else passes through as a literal
//
// Why strip alias entries: `jsonld.flatten(doc, ctx)` honors any `@id`/`@type`
// alias declared in `ctx`, producing output where node identifiers live under
// the alias key (e.g. `componentKey`) instead of `@id`. The downstream
// `convertNode` reads `raw["@id"]` and would see `undefined`. Stripping the
// alias entries gives us the canonical keyword keys without losing
// property-name aliases (e.g. `children: { "@type": "@id" }` is retained).
//
// The stripped alias survives in `narrowContext`'s output, so it round-trips
// to the export side, which re-emits using the alias.
export async function importJsonLd(doc: JsonLdDocument): Promise<ImportResult> {
  const inputContext = extractInputContext(doc);
  const ourContext = narrowContext(inputContext);

  // Pass a derived context that doesn't alias @id / @type — flatten will then
  // emit literal `@id`/`@type` keys regardless of whether the input doc used
  // an alias.
  const flattenContext = stripIdTypeAliases(ourContext);
  // jsonld's typed signature is narrower than what's actually accepted at
  // runtime; cast through unknown to avoid fighting the lib's types.
  const flat = (await jsonld.flatten(
    doc as object,
    flattenContext as unknown as Parameters<typeof jsonld.flatten>[1],
  )) as unknown;

  const graphArr: Array<Record<string, unknown>> = normalizeFlatten(flat);

  const nodes: GraphNode[] = [];
  for (const item of graphArr) {
    const node = convertNode(item, ourContext);
    if (node) nodes.push(node);
  }

  return { context: ourContext, nodes };
}

export async function importJsonLdDocument(
  doc: JsonLdDocument,
): Promise<GraphDocument> {
  const { context, nodes } = await importJsonLd(doc);
  return graphDocument(nodes, context);
}

function normalizeFlatten(flat: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(flat)) {
    return flat.filter(
      (x): x is Record<string, unknown> => typeof x === "object" && x !== null,
    );
  }
  if (typeof flat === "object" && flat !== null) {
    const obj = flat as Record<string, unknown>;
    if (Array.isArray(obj["@graph"])) {
      return obj["@graph"].filter(
        (x): x is Record<string, unknown> =>
          typeof x === "object" && x !== null,
      );
    }
    if ("@id" in obj) return [obj];
  }
  return [];
}

function extractInputContext(
  doc: JsonLdDocument,
): Record<string, unknown> | undefined {
  if (Array.isArray(doc)) return undefined;
  const ctx = (doc as Record<string, unknown>)["@context"];
  if (ctx && typeof ctx === "object" && !Array.isArray(ctx)) {
    return ctx as Record<string, unknown>;
  }
  return undefined;
}

// Map an input @context to our JsonLdContext shape. Only inline-object
// contexts are kept; URL/array contexts pass through as empty (entries get
// inferred during conversion).
//
// Preserved entry shapes:
//   - string `"@id"` or `"@type"` — keyword aliases (e.g. `componentKey: "@id"`)
//   - object with `@type: "@id"` and/or `@container` — link-property declarations
//   - object with `@id: "@id"` or `@id: "@type"` — keyword alias in object form
function narrowContext(
  input: Record<string, unknown> | undefined,
): JsonLdContext {
  const out: JsonLdContext = {};
  if (!input) return out;
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      out[key] = value;
      continue;
    }
    if (typeof value === "object" && value !== null) {
      const v = value as Record<string, unknown>;
      // Object-form keyword alias: { "@id": "@id" } or { "@id": "@type" }
      const aliasTarget = v["@id"];
      if (aliasTarget === "@id" || aliasTarget === "@type") {
        out[key] = { "@id": aliasTarget } as Exclude<ContextEntry, string>;
        continue;
      }
      const entry: Exclude<ContextEntry, string> = {};
      if (v["@type"] === "@id") entry["@type"] = "@id";
      else if (typeof v["@type"] === "string")
        entry["@type"] = v["@type"] as string;
      if (v["@container"] === "@list" || v["@container"] === "@set") {
        entry["@container"] = v["@container"];
      }
      if (Object.keys(entry).length > 0) out[key] = entry;
    }
  }
  return out;
}

function isLinkInContext(context: JsonLdContext, property: string): boolean {
  const entry = context[property];
  if (entry === "@id") return true;
  if (typeof entry === "object" && entry?.["@type"] === "@id") return true;
  return false;
}

function convertNode(
  raw: Record<string, unknown>,
  context: JsonLdContext,
): GraphNode | null {
  const idValue = raw["@id"];
  if (typeof idValue !== "string" || idValue.length === 0) return null;

  const node: GraphNode = {
    id: idValue,
    type: "Unknown",
  };

  for (const [key, value] of Object.entries(raw)) {
    if (key === "@id") continue;
    if (key === "@type") {
      node.type = Array.isArray(value) ? String(value[0]) : String(value);
      continue;
    }

    const declaredLink = isLinkInContext(context, key);
    const result = convertValue(value, declaredLink);

    if (result.isLink && !declaredLink) {
      context[key] = "@id";
    }
    node[key] = result.value;
  }

  return node;
}

interface ConvertedValue {
  value: NodePropertyValue;
  isLink: boolean;
}

function convertValue(value: unknown, declaredLink: boolean): ConvertedValue {
  // {"@value": x} → literal x
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "@value" in value
  ) {
    const v = (value as Record<string, unknown>)["@value"];
    return { value: toJsonValue(v), isLink: false };
  }

  // {"@id": "..."} → singleton link array
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "@id" in value
  ) {
    const id = (value as Record<string, unknown>)["@id"];
    if (typeof id === "string") return { value: [id], isLink: true };
  }

  if (Array.isArray(value)) return convertArray(value, declaredLink);

  // Bare primitive
  if (typeof value === "string") {
    return declaredLink
      ? { value: [value], isLink: true }
      : { value, isLink: false };
  }
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return { value, isLink: false };
  }

  return { value: toJsonValue(value), isLink: false };
}

function convertArray(
  arr: unknown[],
  declaredLink: boolean,
): ConvertedValue {
  const ids: string[] = [];
  let allLinks = arr.length > 0;

  for (const v of arr) {
    if (declaredLink && typeof v === "string") {
      ids.push(v);
      continue;
    }
    if (typeof v === "object" && v !== null && "@id" in (v as object)) {
      const id = (v as Record<string, unknown>)["@id"];
      if (typeof id === "string") {
        ids.push(id);
        continue;
      }
    }
    allLinks = false;
    break;
  }

  if (allLinks) return { value: ids, isLink: true };

  // Literal array — unwrap value objects, preserve JSON-compatible values.
  const values: JsonValue[] = [];
  for (const v of arr) {
    if (
      typeof v === "object" &&
      v !== null &&
      !Array.isArray(v) &&
      "@value" in v
    ) {
      values.push(toJsonValue((v as Record<string, unknown>)["@value"]));
      continue;
    }
    values.push(toJsonValue(v));
  }
  // Expanded JSON-LD pads single literal values into singleton arrays. That's
  // structural, not semantic — unwrap so a scalar in source is a scalar in
  // graph state. (Multi-element literal arrays remain arrays.)
  const [onlyValue] = values;
  if (onlyValue !== undefined && values.length === 1) {
    return { value: onlyValue, isLink: false };
  }
  return { value: values, isLink: false };
}

function toJsonValue(value: unknown): JsonValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        toJsonValue(nested),
      ]),
    );
  }
  return null;
}
