import { z } from "zod";
import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for the graph-view showcase.
//
// This showcase has its own root node type (`GraphView`) but the renderer it
// ships (`NodeCard`) is *generic* — it pulls every node out of the store and
// reflects on its own properties. So the only context entry this showcase
// actually needs is its own vocab; it does not declare any link properties of
// its own. (The cards walk every other showcase's links by reading the
// already-merged top-level `state.graph.context`.)
export const graphViewContext = {
  "@vocab": "http://bwr-graph.example/graph-view/",
} satisfies JsonLdContext;

export const graphViewNodeSchema = z.object({
  id: z.string(),
  type: z.literal("GraphView"),
  title: z.string(),
});

export const graphViewSchema = {
  context: graphViewContext,
  node: graphViewNodeSchema,
} as const;

export type GraphViewGraphNode = z.infer<typeof graphViewNodeSchema>;
