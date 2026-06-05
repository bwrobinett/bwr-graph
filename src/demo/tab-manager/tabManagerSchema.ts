import { z } from "zod";
import type { JsonLdContext } from "../../graph/types";

// Browser/tab-manager vocabulary. This deliberately models browser concepts
// abstractly; Chrome is one adapter that can reconcile into these node types.
export const tabManagerContext = {
  "@vocab": "http://bwr-graph.example/tab-manager/",
  children: { "@type": "@id", "@container": "@list" },
  command: { "@type": "@id" },
  workspace: { "@type": "@id" },
  windows: { "@type": "@id", "@container": "@list" },
  tabs: { "@type": "@id", "@container": "@list" },
  savedTabs: { "@type": "@id", "@container": "@list" },
  boundTab: { "@type": "@id" },
  adapter: { "@type": "@id" },
} satisfies JsonLdContext;

export const tabManagerAppNodeSchema = z.object({
  id: z.string(),
  type: z.literal("TabManagerApp"),
  title: z.string(),
  children: z.array(z.string()),
});

export const tabManagerToolbarNodeSchema = z.object({
  id: z.string(),
  type: z.literal("TabManagerToolbar"),
  children: z.array(z.string()),
});

export const tabManagerButtonNodeSchema = z.object({
  id: z.string(),
  type: z.literal("TabManagerButton"),
  label: z.string(),
  command: z.array(z.string()),
});

export const browserCommandNodeSchema = z.object({
  id: z.string(),
  type: z.literal("BrowserCommand"),
  label: z.string(),
  action: z.string(),
});

export const browserWorkspaceNodeSchema = z.object({
  id: z.string(),
  type: z.literal("BrowserWorkspace"),
  label: z.string(),
  savedTabs: z.array(z.string()),
});

export const browserWindowNodeSchema = z.object({
  id: z.string(),
  type: z.literal("BrowserWindow"),
  label: z.string(),
  focused: z.boolean(),
  tabs: z.array(z.string()),
  adapter: z.array(z.string()).optional(),
  externalId: z.string().optional(),
});

export const browserTabNodeSchema = z.object({
  id: z.string(),
  type: z.literal("BrowserTab"),
  title: z.string(),
  url: z.string(),
  active: z.boolean(),
  pinned: z.boolean(),
  adapter: z.array(z.string()).optional(),
  externalId: z.string().optional(),
});

export const savedTabNodeSchema = z.object({
  id: z.string(),
  type: z.literal("SavedTab"),
  label: z.string(),
  url: z.string(),
  boundTab: z.array(z.string()).optional(),
});

export const browserAdapterNodeSchema = z.object({
  id: z.string(),
  type: z.literal("BrowserAdapter"),
  label: z.string(),
  kind: z.string(),
});

export const tabManagerGraphNodeSchema = z.discriminatedUnion("type", [
  tabManagerAppNodeSchema,
  tabManagerToolbarNodeSchema,
  tabManagerButtonNodeSchema,
  browserCommandNodeSchema,
  browserWorkspaceNodeSchema,
  browserWindowNodeSchema,
  browserTabNodeSchema,
  savedTabNodeSchema,
  browserAdapterNodeSchema,
]);

export const tabManagerSchema = {
  context: tabManagerContext,
  node: tabManagerGraphNodeSchema,
} as const;

export type TabManagerGraphNode = z.infer<typeof tabManagerGraphNodeSchema>;
export type TabManagerGraphDocument = {
  context: typeof tabManagerContext;
  nodes: { [id: string]: TabManagerGraphNode };
};
