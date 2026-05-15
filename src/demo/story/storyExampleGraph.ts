import type { GraphDocument } from "../../graph/types";
import { storySchema } from "./schema";

export const storyExampleGraph = {
  context: storySchema.context,
  nodes: {
    "char-alice": {
      id: "char-alice",
      type: "Character",
      name: "Alice",
      description: "the visitor",
    },
    "char-bob": {
      id: "char-bob",
      type: "Character",
      name: "Bob",
      description: "the cafe owner",
    },
    "char-carol": {
      id: "char-carol",
      type: "Character",
      name: "Carol",
      description: "Alice's old friend",
    },
    "scene-1": {
      id: "scene-1",
      type: "Scene",
      title: "Arrival",
      body: "Alice steps off the train and meets Bob at the platform.",
      characters: ["char-alice", "char-bob"],
    },
    "scene-2": {
      id: "scene-2",
      type: "Scene",
      title: "Cafe afternoon",
      body: "Bob brews espresso while Alice and Carol catch up.",
      characters: ["char-alice", "char-bob", "char-carol"],
    },
    "scene-3": {
      id: "scene-3",
      type: "Scene",
      title: "Goodbye",
      body: "Alice and Carol walk back to the station as the sun sets.",
      characters: ["char-alice", "char-carol"],
    },
    "story-1": {
      id: "story-1",
      type: "Story",
      title: "A Trip Across Town",
      scenes: ["scene-1", "scene-2", "scene-3"],
      characters: ["char-alice", "char-bob", "char-carol"],
    },
  },
} satisfies GraphDocument;
