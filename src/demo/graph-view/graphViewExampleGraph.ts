import type { GraphDocument } from "../../graph/types";
import { graphViewSchema } from "./schema";

export const graphViewExampleGraph = {
  context: graphViewSchema.context,
  nodes: {
    "graph-view-1": {
      id: "graph-view-1",
      type: "GraphView",
      title: "Graph view",
    },
  },
} satisfies GraphDocument;
