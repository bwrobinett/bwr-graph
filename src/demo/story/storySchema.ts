import { z } from "zod";
import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for stories. The graph here is genuinely non-tree:
// `Scene.characters` references `Character` nodes that may also appear in
// other scenes, so the same node has multiple inbound link slots.
export const storyContext = {
  "@vocab": "http://bwr-graph.example/story/",
  scenes: { "@type": "@id", "@container": "@list" },
  characters: { "@type": "@id", "@container": "@set" },
} satisfies JsonLdContext;

export const storyNodeSchema = z.object({
  id: z.string(),
  type: z.literal("Story"),
  title: z.string(),
  scenes: z.array(z.string()),
  characters: z.array(z.string()),
});

export const sceneNodeSchema = z.object({
  id: z.string(),
  type: z.literal("Scene"),
  title: z.string(),
  body: z.string(),
  characters: z.array(z.string()),
});

export const characterNodeSchema = z.object({
  id: z.string(),
  type: z.literal("Character"),
  name: z.string(),
  description: z.string(),
});

export const storyGraphNodeSchema = z.discriminatedUnion("type", [
  storyNodeSchema,
  sceneNodeSchema,
  characterNodeSchema,
]);

export const storySchema = {
  context: storyContext,
  node: storyGraphNodeSchema,
} as const;

export type StoryGraphNode = z.infer<typeof storyGraphNodeSchema>;
export type StoryGraphDocument = {
  context: typeof storyContext;
  nodes: { [id: string]: StoryGraphNode };
};
