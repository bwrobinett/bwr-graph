import type { GraphDocument, GraphNode, JsonLdContext, NodeId } from "./types";
import { mergeContexts } from "./context";

export function nodesById(nodes: Iterable<GraphNode>): Record<NodeId, GraphNode> {
  const out: Record<NodeId, GraphNode> = {};
  for (const node of nodes) {
    out[node.id] = { ...node };
  }
  return out;
}

export function graphDocument(
  nodes: Iterable<GraphNode>,
  context: JsonLdContext = {},
): GraphDocument {
  return {
    context,
    nodes: nodesById(nodes),
  };
}

export function composeGraphDocuments(
  documents: Iterable<GraphDocument>,
): GraphDocument {
  let context: JsonLdContext = {};
  const nodes: Record<NodeId, GraphNode> = {};

  for (const document of documents) {
    context = mergeContexts(context, document.context);
    Object.assign(nodes, document.nodes);
  }

  return { context, nodes };
}
