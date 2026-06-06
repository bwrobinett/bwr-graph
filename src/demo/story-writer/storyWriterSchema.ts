import { z } from "zod";
import type { JsonLdContext } from "../../graph/types";
import { storyContext } from "../story/storySchema";

export const storyWriterContext = {
  ...storyContext,
  target: { "@type": "@id", "@container": "@list" },
  storyIdeas: { "@type": "@id", "@container": "@list" },
  finalStory: { "@type": "@id", "@container": "@list" },
  logs: { "@type": "@id", "@container": "@list" },
} satisfies JsonLdContext;

export const storyWriterNodeSchema = z.object({
  id: z.string(),
  type: z.literal("StoryWriter"),
  title: z.string(),
  prompt: z.string(),
  status: z.enum(["idle", "running", "complete", "failed"]),
  storyIdeas: z.array(z.string()),
  finalStory: z.array(z.string()),
  logs: z.array(z.string()),
  generationNonce: z.number().optional(),
  responderName: z.string().optional(),
  error: z.string().optional(),
});

export const storyWriterRuntimeNodeSchema = z.object({
  id: z.string(),
  type: z.literal("StoryWriterRuntime"),
  target: z.array(z.string()),
});

export const storyWriterLogNodeSchema = z.object({
  id: z.string(),
  type: z.literal("StoryWriterLog"),
  step: z.string(),
  status: z.enum(["running", "complete", "failed"]),
  message: z.string(),
});

export const storyIdeaNodeSchema = z.object({
  id: z.string(),
  type: z.literal("StoryIdea"),
  title: z.string(),
  premise: z.string(),
  tone: z.string().optional(),
});

export const storyWriterGraphNodeSchema = z.discriminatedUnion("type", [
  storyWriterNodeSchema,
  storyWriterRuntimeNodeSchema,
  storyWriterLogNodeSchema,
  storyIdeaNodeSchema,
]);

export const storyWriterSchema = {
  context: storyWriterContext,
  node: storyWriterGraphNodeSchema,
} as const;

export type StoryWriterGraphNode = z.infer<typeof storyWriterGraphNodeSchema>;
export type StoryWriterGraphDocument = {
  context: typeof storyWriterContext;
  nodes: { [id: string]: StoryWriterGraphNode };
};
