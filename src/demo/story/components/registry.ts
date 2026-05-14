import type { Registry } from "../../../renderer/RegistryContext";
import {
  NODE_TYPE_STORY,
  NODE_TYPE_SCENE,
  NODE_TYPE_CHARACTER,
} from "../schema";
import { StoryView } from "./StoryView";
import { SceneView } from "./SceneView";
import { CharacterView } from "./CharacterView";

/**
 * Registry that maps the story node types onto their renderers. Same shape as
 * the other showcase registries — composed into the demo's merged registry at
 * `src/demo/registry.ts`.
 */
export const storyRegistry: Registry = {
  [NODE_TYPE_STORY]: StoryView,
  [NODE_TYPE_SCENE]: SceneView,
  [NODE_TYPE_CHARACTER]: CharacterView,
};
