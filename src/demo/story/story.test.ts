import { describe, it, expect } from "vitest";
import { createStory, loadStory } from "./story";

describe("createStory", () => {
  it("creates a Story node with empty scenes", () => {
    const story = createStory({ title: "Demo" });
    expect(story.storyId).toBe("story-1");
    expect(story.getScenes()).toEqual([]);
    expect(story.getCharacters()).toEqual([]);
  });

  it("adds characters and scenes; scene preserves character link list", () => {
    const story = createStory();
    const alice = story.addCharacter("Alice");
    const bob = story.addCharacter("Bob");
    story.addScene("Opening", "They meet.", [alice.id, bob.id]);

    const scenes = story.getScenes();
    expect(scenes).toHaveLength(1);
    expect(scenes[0].characterIds).toEqual([alice.id, bob.id]);
  });

  it("supports the same character appearing in multiple scenes", () => {
    const story = createStory();
    const alice = story.addCharacter("Alice");
    const bob = story.addCharacter("Bob");
    const carol = story.addCharacter("Carol");

    story.addScene("Scene 1", "Alice arrives.", [alice.id]);
    story.addScene("Scene 2", "Bob and Carol talk.", [bob.id, carol.id]);
    story.addScene("Scene 3", "Alice and Carol meet again.", [alice.id, carol.id]);

    const aliceScenes = story.getScenesForCharacter(alice.id);
    expect(aliceScenes.map((s) => s.title)).toEqual(["Scene 1", "Scene 3"]);

    const carolScenes = story.getScenesForCharacter(carol.id);
    expect(carolScenes.map((s) => s.title)).toEqual(["Scene 2", "Scene 3"]);
  });

  it("linkCharacterToScene appends a character to an existing scene", () => {
    const story = createStory();
    const alice = story.addCharacter("Alice");
    const bob = story.addCharacter("Bob");
    const scene = story.addScene("Cafe", "A scene.", [alice.id]);

    story.linkCharacterToScene(scene.id, bob.id);
    const updated = story.getScenes()[0];
    expect(updated.characterIds).toEqual([alice.id, bob.id]);
  });

  it("auto-generates sequential scene + character IDs", () => {
    const story = createStory();
    const a = story.addCharacter("A");
    const b = story.addCharacter("B");
    const s1 = story.addScene("One", "");
    const s2 = story.addScene("Two", "");
    expect(a.id).toBe("char-1");
    expect(b.id).toBe("char-2");
    expect(s1.id).toBe("scene-1");
    expect(s2.id).toBe("scene-2");
  });
});

describe("toJsonLd round-trip preserves multi-references", () => {
  it("exports a story with shared character refs and re-imports it intact", async () => {
    const story = createStory({ title: "Trip" });
    const alice = story.addCharacter("Alice", "the guide");
    const bob = story.addCharacter("Bob");
    const carol = story.addCharacter("Carol");

    story.addScene("Arrival", "Alice meets Bob.", [alice.id, bob.id]);
    story.addScene("Dinner", "All three together.", [alice.id, bob.id, carol.id]);
    story.addScene("Goodbye", "Alice and Carol leave.", [alice.id, carol.id]);

    const doc = story.toJsonLd();
    const resumed = await loadStory(doc);

    expect(resumed.storyId).toBe("story-1");
    expect(resumed.getCharacters().map((c) => c.name).sort()).toEqual([
      "Alice",
      "Bob",
      "Carol",
    ]);

    const scenes = resumed.getScenes();
    expect(scenes.map((s) => s.title)).toEqual(["Arrival", "Dinner", "Goodbye"]);

    const aliceScenes = resumed.getScenesForCharacter(alice.id);
    expect(aliceScenes.map((s) => s.title)).toEqual([
      "Arrival",
      "Dinner",
      "Goodbye",
    ]);
  });

  it("resumed story continues IDs past the loaded set", async () => {
    const story = createStory();
    story.addCharacter("Alice");
    story.addScene("One", "");

    const doc = story.toJsonLd();
    const resumed = await loadStory(doc);
    const newChar = resumed.addCharacter("Bob");
    const newScene = resumed.addScene("Two", "");

    expect(newChar.id).toBe("char-2");
    expect(newScene.id).toBe("scene-2");
  });
});
