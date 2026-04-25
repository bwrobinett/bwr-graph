import type { JsonLdContext, ContextEntry } from "./types";

// A property is a link only if the @context says so (`@type: @id`). Arrays of
// values are NOT assumed to be links — an array might just be a list of
// strings, numbers, etc. Links *must* be in arrays (even singletons), but the
// inverse is not true.
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

// Container semantics — affects whether order matters. The reducer doesn't
// care, but consumers (sort selectors, equality checks) might.
export function isOrderedProperty(
  context: JsonLdContext,
  property: string,
): boolean {
  const entry = context[property];
  if (entry === undefined) return true; // arrays are ordered by default
  if (typeof entry === "object" && entry["@container"] === "@set") return false;
  return true;
}

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
