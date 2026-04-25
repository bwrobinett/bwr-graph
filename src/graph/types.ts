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

export type NodeId = string;

export type Primitive = string | number | boolean | null;

// Arrays can be either literal values OR node ID references (links). The
// reducer treats both as `string[]`/`Primitive[]`. The @context disambiguates
// at the selector layer.
export type NodePropertyValue = Primitive | Primitive[] | NodeId[];

// Open-ended: a node has `id`, `type`, and arbitrary properties.
export interface GraphNode {
  id: NodeId;
  type: string;
  [property: string]: NodePropertyValue;
}

// JSON-LD-style context. Keyed by property name OR a @-prefixed JSON-LD
// keyword (@vocab, @base, etc.). A term definition may be:
//   - "@id"     — shorthand for { "@type": "@id" } (links)
//   - any other string — IRI alias (treated as literal at the term level)
//   - object form { "@type": "@id" }                — links
//   - object form { "@container": "@list" | "@set" } — order semantics
//   - any other shape — treated as literal
export type ContextEntry =
  | string
  | {
      "@id"?: string;
      "@type"?: "@id" | string;
      "@container"?: "@list" | "@set";
    };

export interface JsonLdContext {
  [propertyName: string]: ContextEntry;
}

export interface GraphState {
  nodes: Record<NodeId, GraphNode>;
  context: JsonLdContext;
}

// Identifies a slot inside a link array.
export interface LinkLocation {
  nodeId: NodeId;
  property: string;
  index?: number;
}

// ---- Action payloads ----

export interface AddNodePayload {
  id: NodeId;
  type: string;
  [property: string]: NodePropertyValue;
}

export interface UpdateNodePayload {
  id: NodeId;
  [property: string]: NodePropertyValue;
}

export interface DeleteNodePayload {
  id: NodeId;
}

export interface InsertLinkPayload {
  targetId: NodeId;
  at: LinkLocation;
}

export interface RemoveLinkPayload {
  at: LinkLocation;
  targetId?: NodeId;
}

export interface SetContextPayload {
  context: JsonLdContext;
  // If true, merge with existing context. If false (default), replace.
  merge?: boolean;
}
