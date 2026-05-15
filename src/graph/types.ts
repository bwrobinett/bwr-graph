// Core graph types — the foundation everything else builds on.
//
// State shape:  { nodes, context }
// - `nodes` is a flat dictionary keyed by NodeId.
// - `context` is a JSON-LD-style @context that declares which properties are
//   links (`@type: @id`) vs literals. The reducer doesn't consult it; selectors
//   and the renderer do.
//
// Convention: links MUST be wrapped in arrays (always, even singletons). But
// the inverse is not true — arrays can hold literals (strings, numbers).
// The @context disambiguates: only properties marked `@type: @id` are links.

/** Stable identifier for a node. Strings so they can carry IRIs or short ids. */
export type NodeId = string;

/** A leaf value on a node — anything that isn't a link to another node. */
export type Primitive = string | number | boolean | null;

/**
 * A node property's value. Arrays are ambiguous at the type level — they may be
 * link arrays (NodeId[]) or literal arrays (Primitive[]). The @context resolves
 * the ambiguity at the selector layer; the reducer treats both as plain arrays.
 */
export type NodePropertyValue = Primitive | Primitive[] | NodeId[];

/**
 * A graph node. Required keys are `id` and `type`; everything else is open —
 * literals are stored bare, links are stored as `NodeId[]` (always arrays,
 * even singletons).
 */
export interface GraphNode {
  id: NodeId;
  type: string;
  [property: string]: NodePropertyValue;
}

/**
 * One entry in a JSON-LD `@context`. May be a string shorthand or an object
 * with `@type` / `@container` qualifiers. `"@id"` (string or `@type: "@id"`
 * object form) marks the property as a link; other shapes are literals.
 */
export type ContextEntry =
  | string
  | {
      "@id"?: string;
      "@type"?: "@id" | string;
      "@container"?: "@list" | "@set";
    };

/**
 * JSON-LD-style context map. Keys are property names or `@`-prefixed JSON-LD
 * keywords (`@vocab`, `@base`, …). Used by selectors + JSON-LD I/O to decide
 * which properties are links and whether order matters.
 */
export interface JsonLdContext {
  [propertyName: string]: ContextEntry;
}

/** Redux slice state — flat node dictionary plus the active context. */
export interface GraphState {
  nodes: Record<NodeId, GraphNode>;
  context: JsonLdContext;
}

/**
 * Portable graph payload: the same flat dictionary + context shape as store
 * state, but without any Redux coupling. Demo seeds, JSON-LD imports, and
 * composition code can prepare one of these before touching the store.
 */
export interface GraphDocument {
  nodes: Record<NodeId, GraphNode>;
  context: JsonLdContext;
}

/**
 * Address of a slot inside a link array. `index` is optional — omit to mean
 * "the end" (insertLink) or "any matching entry" (removeLink).
 */
export interface LinkLocation {
  nodeId: NodeId;
  property: string;
  index?: number;
}

/** Payload for `addNode`. Extra properties are stored verbatim on the node. */
export interface AddNodePayload {
  id: NodeId;
  type: string;
  [property: string]: NodePropertyValue;
}

/**
 * Payload for `updateNode`. `id` selects the node; `type` is ignored if
 * present (type is structural and only set at creation).
 */
export interface UpdateNodePayload {
  id: NodeId;
  [property: string]: NodePropertyValue;
}

/** Payload for `deleteNode`. */
export interface DeleteNodePayload {
  id: NodeId;
}

/**
 * Payload for `insertLink`. `targetId` is the node being linked *to*; `at`
 * names the source slot (`{ nodeId, property, index? }`).
 */
export interface InsertLinkPayload {
  targetId: NodeId;
  at: LinkLocation;
}

/**
 * Payload for `removeLink`. Either `at.index` (positional) or `targetId`
 * (first match wins) identifies which entry to drop.
 */
export interface RemoveLinkPayload {
  at: LinkLocation;
  targetId?: NodeId;
}

/**
 * Payload for `setContext`. With `merge: true`, overlays onto the existing
 * context; otherwise replaces it outright.
 */
export interface SetContextPayload {
  context: JsonLdContext;
  merge?: boolean;
}
