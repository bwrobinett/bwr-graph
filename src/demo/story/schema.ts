import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for stories. The graph here is genuinely non-tree:
// `Scene.characters` references `Character` nodes that may also appear in
// other scenes, so the same node has multiple inbound link slots.
export const storyContext: JsonLdContext = {
  "@vocab": "http://bwr-graph.example/story/",
  scenes: { "@type": "@id", "@container": "@list" },
  characters: { "@type": "@id", "@container": "@set" },
};

export const NODE_TYPE_STORY = "Story";
export const NODE_TYPE_SCENE = "Scene";
export const NODE_TYPE_CHARACTER = "Character";

export interface SceneView {
  id: string;
  title: string;
  body: string;
  characterIds: string[];
}

export interface CharacterView {
  id: string;
  name: string;
  description: string;
}
