import { addNode, insertLink, setContext } from "../../graph/slice";
import { store } from "../store";
import {
  storyContext,
  NODE_TYPE_STORY,
  NODE_TYPE_SCENE,
  NODE_TYPE_CHARACTER,
} from "./schema";

/**
 * Seed the story showcase into the demo store. Mirrors the sample story from
 * `cli.ts` ("A Trip Across Town") so the in-browser view and the CLI agree on
 * the canonical demo content.
 *
 * Idempotent — `addNode` is a no-op on existing ids, and `insertLink` is only
 * called once at seed time (no input event re-runs the seed).
 *
 * The library still exposes a `createStory()` API (`./story.ts`) that owns its
 * own Redux store — this seed is the UI dual: same vocab, same graph shape,
 * but composed into the shared demo store so it can sit alongside the form,
 * chatbot, and graph-view showcases.
 */
export function seedStory(): void {
  store.dispatch(setContext({ context: storyContext, merge: true }));

  // Characters first — scenes reference them by id.
  store.dispatch(
    addNode({
      id: "char-alice",
      type: NODE_TYPE_CHARACTER,
      name: "Alice",
      description: "the visitor",
    }),
  );
  store.dispatch(
    addNode({
      id: "char-bob",
      type: NODE_TYPE_CHARACTER,
      name: "Bob",
      description: "the cafe owner",
    }),
  );
  store.dispatch(
    addNode({
      id: "char-carol",
      type: NODE_TYPE_CHARACTER,
      name: "Carol",
      description: "Alice's old friend",
    }),
  );

  // Scenes — each carries its own cast (a `@set` link to characters).
  store.dispatch(
    addNode({
      id: "scene-1",
      type: NODE_TYPE_SCENE,
      title: "Arrival",
      body: "Alice steps off the train and meets Bob at the platform.",
      characters: ["char-alice", "char-bob"],
    }),
  );
  store.dispatch(
    addNode({
      id: "scene-2",
      type: NODE_TYPE_SCENE,
      title: "Cafe afternoon",
      body: "Bob brews espresso while Alice and Carol catch up.",
      characters: ["char-alice", "char-bob", "char-carol"],
    }),
  );
  store.dispatch(
    addNode({
      id: "scene-3",
      type: NODE_TYPE_SCENE,
      title: "Goodbye",
      body: "Alice and Carol walk back to the station as the sun sets.",
      characters: ["char-alice", "char-carol"],
    }),
  );

  // Story root — links scenes (ordered) + characters (set).
  store.dispatch(
    addNode({
      id: "story-1",
      type: NODE_TYPE_STORY,
      title: "A Trip Across Town",
      scenes: [],
      characters: [],
    }),
  );
  for (const sceneId of ["scene-1", "scene-2", "scene-3"]) {
    store.dispatch(
      insertLink({
        targetId: sceneId,
        at: { nodeId: "story-1", property: "scenes" },
      }),
    );
  }
  for (const charId of ["char-alice", "char-bob", "char-carol"]) {
    store.dispatch(
      insertLink({
        targetId: charId,
        at: { nodeId: "story-1", property: "characters" },
      }),
    );
  }
}
