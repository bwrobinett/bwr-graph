import { createSelector } from "@reduxjs/toolkit";
import type { GraphState, GraphNode, NodeId } from "./types";
import { isLinkProperty } from "./context";

/** Minimum store shape these selectors care about. */
export interface RootState {
  graph: GraphState;
}

/** Whole graph slice — escape hatch for one-off lookups. */
export const selectGraph = (state: RootState) => state.graph;
/** Raw node dictionary — useful as input to memoized selectors. */
export const selectNodes = (state: RootState) => state.graph.nodes;
/** Active JSON-LD context — needed when interpreting properties as links vs literals. */
export const selectContext = (state: RootState) => state.graph.context;

/** Look up one node by id. Returns `null` if absent (never throws). */
export const selectNode = (state: RootState, id: NodeId): GraphNode | null =>
  state.graph.nodes[id] ?? null;

/** Convenience for the common `node?.type` lookup. */
export const selectNodeType = (state: RootState, id: NodeId): string | null =>
  state.graph.nodes[id]?.type ?? null;

/**
 * Dereference a link property. Returns the full linked nodes, dropping
 * dangling ids. Returns `[]` if the property isn't declared as a link in the
 * @context — literal arrays don't accidentally get walked as graph edges.
 */
export const selectLinkedNodes = (
  state: RootState,
  nodeId: NodeId,
  property: string,
): GraphNode[] => {
  const node = state.graph.nodes[nodeId];
  if (!node) return [];
  if (!isLinkProperty(state.graph.context, property)) return [];
  const ids = node[property];
  if (!Array.isArray(ids)) return [];
  const out: GraphNode[] = [];
  for (const id of ids) {
    if (typeof id !== "string") continue;
    const target = state.graph.nodes[id];
    if (target) out.push(target);
  }
  return out;
};

/**
 * Like `selectLinkedNodes` but returns just the ids — cheaper, and friendly
 * to React equality checks (compare two `string[]` arrays element-wise).
 */
export const selectLinkedIds = (
  state: RootState,
  nodeId: NodeId,
  property: string,
): NodeId[] => {
  const node = state.graph.nodes[nodeId];
  if (!node) return [];
  if (!isLinkProperty(state.graph.context, property)) return [];
  const ids = node[property];
  if (!Array.isArray(ids)) return [];
  const out: string[] = [];
  for (const v of ids) {
    if (typeof v === "string") out.push(v);
  }
  return out;
};

/**
 * Factory for a memoized "all nodes of type X" selector. One per call site —
 * each instance has its own memo cache, so unrelated components don't
 * invalidate each other.
 */
export const makeSelectNodesByType = () =>
  createSelector(
    [selectNodes, (_: RootState, type: string) => type],
    (nodes, type) => Object.values(nodes).filter((n) => n.type === type),
  );

/**
 * BFS over a single link property starting at `rootId`. Returns ids in
 * traversal order (root first). Cycle-safe via a visited set, so DAGs and
 * back-edges are handled. If the property isn't a declared link, returns
 * `[rootId]` (or `[]` if the root is missing) — no traversal.
 */
export const selectSubtreeIds = (
  state: RootState,
  rootId: NodeId,
  property: string,
): NodeId[] => {
  if (!isLinkProperty(state.graph.context, property)) {
    return state.graph.nodes[rootId] ? [rootId] : [];
  }
  const result: NodeId[] = [];
  const visited = new Set<NodeId>();
  const queue: NodeId[] = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = state.graph.nodes[id];
    if (!node) continue;
    result.push(id);
    const links = node[property];
    if (Array.isArray(links)) {
      for (const childId of links) {
        if (typeof childId === "string" && !visited.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }
  return result;
};
