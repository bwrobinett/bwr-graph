import { z } from "zod";
import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for the meta-showcase: the demo shell itself, rendered as
// a graph. A `DemoApp` node owns an ordered list of `DemoTab` nodes plus a
// scalar `activeDemo` key pointing at one of the tabs.
//
// Links:
// - `tabs` (DemoApp → DemoTab[]): the nav order, ordered list.
// - `runtimeRoots` (DemoApp → runtime nodes): non-visual graph processes the
//   shell keeps mounted alongside the visible showcase.
// - `target` (DemoTab → showcase root): which subgraph this tab activates
//   (`form-1`, `conv-1`, …).
// - `app` (DemoTab → DemoApp): back-ref so a tab can dispatch updates against
//   its owning app without the component knowing the app id at compile time.
export const demoShellContext = {
  "@vocab": "http://bwr-graph.example/demo-shell/",
  tabs: { "@type": "@id", "@container": "@list" },
  runtimeRoots: { "@type": "@id", "@container": "@list" },
  target: { "@type": "@id" },
  app: { "@type": "@id" },
} satisfies JsonLdContext;

export const demoAppNodeSchema = z.object({
  id: z.string(),
  type: z.literal("DemoApp"),
  title: z.string(),
  tabs: z.array(z.string()),
  activeDemo: z.string(),
  runtimeRoots: z.array(z.string()).optional(),
});

export const demoTabNodeSchema = z.object({
  id: z.string(),
  type: z.literal("DemoTab"),
  key: z.string(),
  label: z.string(),
  target: z.array(z.string()),
  app: z.array(z.string()),
});

export const demoShellGraphNodeSchema = z.discriminatedUnion("type", [
  demoAppNodeSchema,
  demoTabNodeSchema,
]);

export const demoShellSchema = {
  context: demoShellContext,
  node: demoShellGraphNodeSchema,
} as const;

export type DemoShellGraphNode = z.infer<typeof demoShellGraphNodeSchema>;
export type DemoShellGraphDocument = {
  context: typeof demoShellContext;
  nodes: { [id: string]: DemoShellGraphNode };
};
