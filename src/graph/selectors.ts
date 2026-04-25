import { createSelector } from "@reduxjs/toolkit";
import type { GraphState, GraphNode, NodeId } from "./types";
import { isLinkProperty } from "./context";

export interface RootState {
  graph: GraphState;
}

export const selectGraph = (state: RootState) => state.graph;
export const selectNodes = (state: RootState) => state.graph.nodes;
export const selectContext = (state: RootState) => state.graph.context;

export const selectNode = (state: RootState, id: NodeId): GraphNode | null =>
  state.graph.nodes[id] ?? null;

export const selectNodeType = (state: RootState, id: NodeId): string | null =>
  state.graph.nodes[id]?.type ?? null;

// Follow a link property — returns the linked nodes, filtering dangling
// references. Consults the @context: returns [] if the property isn't
// declared as a link.
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

// Convenience: linked node IDs without dereferencing.
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

export const makeSelectNodesByType = () =>
  createSelector(
    [selectNodes, (_: RootState, type: string) => type],
    (nodes, type) => Object.values(nodes).filter((n) => n.type === type),
  );

// BFS over a single link property. Handles cycles via a visited set.
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
