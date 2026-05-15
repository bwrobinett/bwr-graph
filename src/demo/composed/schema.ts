import { z } from "zod";
import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for the composed showcase.
//
// `panels` is an ordered link list — points at the root of each showcase
// subgraph this view should display (form-1, conv-composed-1, story-1, …).
// Crucially, the panels link is type-agnostic: a panel can point at ANY node
// from any schema, and the merged registry handles rendering. That's the
// whole punchline — composition is just "link to anything; let the registry
// dispatch."
export const composedContext = {
  "@vocab": "http://bwr-graph.example/composed/",
  panels: { "@type": "@id", "@container": "@list" },
} satisfies JsonLdContext;

export const composedNodeSchema = z.object({
  id: z.string(),
  type: z.literal("Composed"),
  title: z.string(),
  panels: z.array(z.string()),
});

export const composedSchema = {
  context: composedContext,
  node: composedNodeSchema,
} as const;

export type ComposedGraphNode = z.infer<typeof composedNodeSchema>;
