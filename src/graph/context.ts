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
 * Look up an alias for a JSON-LD keyword in the active context. Returns the
 * alias key if any context entry maps to the keyword, else undefined.
 *
 * Example: with `{ componentKey: { "@id": "@id" } }`,
 * `findAliasFor(ctx, "@id")` returns `"componentKey"`.
 *
 * NOTE: only the object form `{ "@id": "@id" }` is treated as a keyword
 * alias. The string form `"key": "@id"` is reserved for the link-property
 * shorthand (equivalent to `{ "@type": "@id" }`) used throughout this
 * codebase — see `isLinkProperty`. To declare a keyword alias, always use
 * the object form. If multiple aliases exist for the same keyword, the
 * first encountered wins (object key order).
 */
export function findAliasFor(
  context: JsonLdContext,
  keyword: "@id" | "@type",
): string | undefined {
  for (const [key, entry] of Object.entries(context)) {
    if (key.startsWith("@")) continue;
    if (
      typeof entry === "object" &&
      entry !== null &&
      (entry as { "@id"?: string })["@id"] === keyword
    ) {
      return key;
    }
  }
  return undefined;
}

/**
 * Drop entries that alias the `@id` or `@type` JSON-LD keywords. Used by the
 * import path before handing the context to `jsonld.flatten` — without this
 * step, `flatten` honors the alias and emits node identifiers under the
 * alias key (e.g. `componentKey`) instead of `@id`, which `convertNode`
 * doesn't recognize.
 *
 * Defensive: strips BOTH the spec-canonical string form (`key: "@id"`) and
 * the object form (`key: { "@id": "@id" }`). The string form is overloaded
 * in this codebase (it's also used as link-property shorthand in
 * `state.context`), but `jsonld.flatten` always treats it as an alias; we
 * neutralize the aliasing hint before flattening regardless of intent.
 * Property-name link declarations using the unambiguous object form
 * (`key: { "@type": "@id" }`) are retained.
 */
export function stripIdTypeAliases(context: JsonLdContext): JsonLdContext {
  const out: JsonLdContext = {};
  for (const [key, entry] of Object.entries(context)) {
    if (entry === "@id" || entry === "@type") continue;
    if (typeof entry === "object" && entry !== null) {
      const id = (entry as { "@id"?: string })["@id"];
      if (id === "@id" || id === "@type") continue;
    }
    out[key] = entry;
  }
  return out;
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
