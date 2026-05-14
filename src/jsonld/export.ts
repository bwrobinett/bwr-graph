import type {
  GraphNode,
  GraphState,
  JsonLdContext,
  NodeId,
  NodePropertyValue,
} from "../graph/types";
import { findAliasFor, isLinkProperty } from "../graph/context";
import type { JsonLdDocument } from "./import";

export interface ExportOptions {
  // If provided, only nodes reachable via link properties from rootId are
  // included. Otherwise all nodes in state are exported.
  rootId?: NodeId;

  // Default true — emit @context with the doc.
  includeContext?: boolean;
}

// Reverse of importJsonLd. Produces compact-flattened JSON-LD: an object with
// @context and @graph, where each node has @id, @type, and properties. Link
// arrays emit as either a bare string (singleton) or an array of strings,
// matching the shape jsonld.flatten produces from the same input.
export function exportJsonLd(
  state: GraphState,
  options: ExportOptions = {},
): JsonLdDocument {
  const { rootId, includeContext = true } = options;

  const ids = rootId
    ? collectReachable(state, rootId)
    : Object.keys(state.nodes);

  const graphArr = ids
    .map((id) => state.nodes[id])
    .filter((n): n is GraphNode => n !== undefined)
    .map((node) => emitNode(node, state.context));

  const out: Record<string, unknown> = { "@graph": graphArr };
  if (includeContext) out["@context"] = state.context;
  return out;
}

function collectReachable(state: GraphState, rootId: NodeId): NodeId[] {
  const visited = new Set<NodeId>();
  const queue: NodeId[] = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    const node = state.nodes[id];
    if (!node) continue;
    visited.add(id);
    for (const [property, value] of Object.entries(node)) {
      if (property === "id" || property === "type") continue;
      if (!isLinkProperty(state.context, property)) continue;
      if (!Array.isArray(value)) continue;
      for (const childId of value) {
        if (typeof childId === "string" && !visited.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }
  return Array.from(visited);
}

function emitNode(
  node: GraphNode,
  context: JsonLdContext,
): Record<string, unknown> {
  // Honor any `@id` / `@type` alias declared in the active context — emit the
  // node's identifier and type under the alias key so the doc round-trips
  // through the same vocabulary it was imported with. Falls back to the
  // canonical keywords when no alias is declared.
  const idKey = findAliasFor(context, "@id") ?? "@id";
  const typeKey = findAliasFor(context, "@type") ?? "@type";

  const out: Record<string, unknown> = {
    [idKey]: node.id,
    [typeKey]: node.type,
  };

  for (const [key, value] of Object.entries(node)) {
    if (key === "id" || key === "type") continue;
    out[key] = emitValue(value, isLinkProperty(context, key));
  }

  return out;
}

function emitValue(
  value: NodePropertyValue,
  isLink: boolean,
): unknown {
  if (isLink && Array.isArray(value)) {
    // Link arrays: emit as bare string (singleton) or string[] (multi).
    // Matches jsonld.flatten's compact form when context declares @type: @id.
    const ids = value.filter((v): v is string => typeof v === "string");
    if (ids.length === 1) return ids[0];
    return ids;
  }
  return value;
}
