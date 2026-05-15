import { graphDocument } from "../../graph/document";
import type { GraphDocument } from "../../graph/types";
import { graphViewContext, NODE_TYPE_GRAPH_VIEW } from "./schema";

/**
 * Portable graph-view showcase document. It declares a vocab and adds the
 * `graph-view-1` root node that the tab targets.
 */
export function graphViewDocument(): GraphDocument {
  return graphDocument(
    [
      {
        id: "graph-view-1",
        type: NODE_TYPE_GRAPH_VIEW,
        title: "Graph view",
      },
    ],
    graphViewContext,
  );
}
