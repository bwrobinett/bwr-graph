import type { JsonLdContext, ContextEntry } from "./types";

/**
 * Decide whether a property is a link (vs a literal). Links are explicitly
 * declared in the @context as `"@id"` or `{ "@type": "@id" }`. The shape of
 * the value alone isn't enough — a string-array might be a literal list, not
 * a list of node ids.
 */
export function isLinkProperty(
  context: JsonLdContext,
  property: string,
): boolean {
  const entry = context[property];
  if (entry === undefined) return false;
  if (entry === "@id") return true;
  if (typeof entry === "object" && entry["@type"] === "@id") return true;
  return false;
}

/**
 * Whether a link array's order is semantically meaningful. Defaults to true
 * (arrays are ordered); an explicit `@container: @set` opts out. The reducer
 * is order-preserving regardless — this is a hint for consumers (equality
 * checks, sort UIs).
 */
export function isOrderedProperty(
  context: JsonLdContext,
  property: string,
): boolean {
  const entry = context[property];
  if (entry === undefined) return true; // arrays are ordered by default
  if (typeof entry === "object" && entry["@container"] === "@set") return false;
  return true;
}

/**
 * Shallow-merge two contexts; `overlay` entries win on key collision. Used by
 * `setContext({ merge: true })` and the JSON-LD import path so additive
 * vocabularies don't clobber what's already declared.
 */
export function mergeContexts(
  base: JsonLdContext,
  overlay: JsonLdContext,
): JsonLdContext {
  const out: JsonLdContext = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    out[key] = value as ContextEntry;
  }
  return out;
}
