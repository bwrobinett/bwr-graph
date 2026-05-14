import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for the graph-view showcase.
//
// This showcase has its own root node type (`GraphView`) but the renderer it
// ships (`NodeCard`) is *generic* — it pulls every node out of the store and
// reflects on its own properties. So the only context entry this showcase
// actually needs is its own vocab; it does not declare any link properties of
// its own. (The cards walk every other showcase's links by reading the
// already-merged top-level `state.graph.context`.)
export const graphViewContext: JsonLdContext = {
  "@vocab": "http://bwr-graph.example/graph-view/",
};

export const NODE_TYPE_GRAPH_VIEW = "GraphView";

/** View-model for the root node. Currently just the title. */
export interface GraphViewView {
  id: string;
  title: string;
}
