import type { Registry } from "../../../renderer/RegistryContext";
import { StoryWriterRuntime } from "./StoryWriterRuntime";
import { StoryWriterView } from "./StoryWriterView";

export const storyWriterRegistry: Registry = {
  StoryWriter: StoryWriterView,
  StoryWriterRuntime,
};
