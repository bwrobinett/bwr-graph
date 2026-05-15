import type { Registry } from "../../../renderer/RegistryContext";
import { StoryView } from "./StoryView";
import { SceneView } from "./SceneView";
import { CharacterView } from "./CharacterView";

/**
 * Registry that maps the story node types onto their renderers. Same shape as
 * the other showcase registries — composed into the demo's merged registry at
 * `src/demo/registry.ts`.
 */
export const storyRegistry: Registry = {
  Story: StoryView,
  Scene: SceneView,
  Character: CharacterView,
};
