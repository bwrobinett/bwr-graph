import { graphViewSchema, type GraphViewGraphDocument } from "./graphViewSchema";

export const graphViewExampleGraph = {
  context: graphViewSchema.context,
  nodes: {
    "graph-view-1": {
      id: "graph-view-1",
      type: "GraphView",
      title: "Graph view",
    },
  },
} satisfies GraphViewGraphDocument;
