import jsonld from "jsonld";
import type {
  GraphNode,
  JsonLdContext,
  ContextEntry,
  NodePropertyValue,
  Primitive,
} from "../graph/types";

// A JSON-LD document, in any of compact, expanded, or flattened form.
export type JsonLdDocument =
  | Record<string, unknown>
  | Array<Record<string, unknown>>;

export interface ImportResult {
  context: JsonLdContext;
  nodes: GraphNode[];
}

// Import a JSON-LD doc into our flat-graph shape. Uses jsonld.flatten with the
// doc's own @context, then walks each node:
//   - @id  → id
//   - @type → type (single string; arrays collapse to their first entry)
//   - declared @id properties: bare strings or [string, ...] become link arrays
//   - {"@id": "..."} value objects also become links
//   - {"@value": x} value objects unwrap to x
//   - everything else passes through as a literal
export async function importJsonLd(doc: JsonLdDocument): Promise<ImportResult> {
  const inputContext = extractInputContext(doc);
  // jsonld's typed signature is narrower than what's actually accepted at
  // runtime; cast through unknown to avoid fighting the lib's types.
  const flat = (await jsonld.flatten(
    doc as object,
    (inputContext as unknown) as Parameters<typeof jsonld.flatten>[1],
  )) as unknown;

  const graphArr: Array<Record<string, unknown>> = normalizeFlatten(flat);
  const ourContext = narrowContext(inputContext);

  const nodes: GraphNode[] = [];
  for (const item of graphArr) {
    const node = convertNode(item, ourContext);
    if (node) nodes.push(node);
  }

  return { context: ourContext, nodes };
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
    return { value: toPrimitive(v), isLink: false };
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

  return { value: toPrimitive(value), isLink: false };
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

  // Literal array — unwrap value objects, keep primitives.
  const primitives: Primitive[] = [];
  for (const v of arr) {
    if (
      typeof v === "object" &&
      v !== null &&
      !Array.isArray(v) &&
      "@value" in v
    ) {
      primitives.push(toPrimitive((v as Record<string, unknown>)["@value"]));
      continue;
    }
    if (
      v === null ||
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      primitives.push(v);
    }
  }
  // Expanded JSON-LD pads single literal values into singleton arrays. That's
  // structural, not semantic — unwrap so a scalar in source is a scalar in
  // graph state. (Multi-element literal arrays remain arrays.)
  if (primitives.length === 1) {
    return { value: primitives[0], isLink: false };
  }
  return { value: primitives, isLink: false };
}

function toPrimitive(value: unknown): Primitive {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }
  if (value === undefined) return null;
  return String(value);
}
