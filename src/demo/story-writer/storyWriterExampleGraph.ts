import { storyWriterSchema, type StoryWriterGraphDocument } from "./storyWriterSchema";

export const storyWriterExampleGraph = {
  context: storyWriterSchema.context,
  nodes: {
    "story-writer-runtime-1": {
      id: "story-writer-runtime-1",
      type: "StoryWriterRuntime",
      target: ["story-writer-1"],
    },
    "story-writer-1": {
      id: "story-writer-1",
      type: "StoryWriter",
      title: "Short story writer",
      prompt: "Come up with a fresh idea for a five-minute short story.",
      status: "idle",
      storyIdeas: [],
      finalStory: [],
      logs: [],
      generationNonce: 0,
    },
  },
} satisfies StoryWriterGraphDocument;
