import { graphDocument } from "../../graph/document";
import type { GraphDocument } from "../../graph/types";
import {
  storyContext,
  NODE_TYPE_STORY,
  NODE_TYPE_SCENE,
  NODE_TYPE_CHARACTER,
} from "./schema";

/**
 * Portable story showcase document. Mirrors the sample story from
 * `cli.ts` ("A Trip Across Town") so the in-browser view and the CLI agree on
 * the canonical demo content.
 *
 * The library still exposes a `createStory()` API (`./story.ts`) that owns its
 * own Redux store — this document is the UI dual: same vocab, same graph
 * shape, but portable so it can sit alongside other showcase documents.
 */
export function storyDocument(): GraphDocument {
  return graphDocument(
    [
      {
        id: "char-alice",
        type: NODE_TYPE_CHARACTER,
        name: "Alice",
        description: "the visitor",
      },
      {
        id: "char-bob",
        type: NODE_TYPE_CHARACTER,
        name: "Bob",
        description: "the cafe owner",
      },
      {
        id: "char-carol",
        type: NODE_TYPE_CHARACTER,
        name: "Carol",
        description: "Alice's old friend",
      },
      {
        id: "scene-1",
        type: NODE_TYPE_SCENE,
        title: "Arrival",
        body: "Alice steps off the train and meets Bob at the platform.",
        characters: ["char-alice", "char-bob"],
      },
      {
        id: "scene-2",
        type: NODE_TYPE_SCENE,
        title: "Cafe afternoon",
        body: "Bob brews espresso while Alice and Carol catch up.",
        characters: ["char-alice", "char-bob", "char-carol"],
      },
      {
        id: "scene-3",
        type: NODE_TYPE_SCENE,
        title: "Goodbye",
        body: "Alice and Carol walk back to the station as the sun sets.",
        characters: ["char-alice", "char-carol"],
      },
      {
        id: "story-1",
        type: NODE_TYPE_STORY,
        title: "A Trip Across Town",
        scenes: ["scene-1", "scene-2", "scene-3"],
        characters: ["char-alice", "char-bob", "char-carol"],
      },
    ],
    storyContext,
  );
}
