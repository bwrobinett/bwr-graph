import type { Registry } from "../renderer/RegistryContext";
import { formRegistry } from "./form/components/registry";
import { chatbotRegistry } from "./chatbot/components/registry";
import { demoShellRegistry } from "./demo/components/registry";
import { graphViewRegistry } from "./graph-view/components/registry";
import { storyRegistry } from "./story/components/registry";
import { composedRegistry } from "./composed/components/registry";
import { tabManagerRegistry } from "./tab-manager/components/registry";

/**
 * The demo's merged registry: meta-shell + every showcase. Single
 * `RegistryContext.Provider` value at the top of the tree means any node
 * type from any showcase is renderable from any subtree — that's the dogfood
 * point. Showcases with different vocabularies can compose in the same graph
 * (e.g. a chatbot Message embedding a Form node — see the Composed tab).
 */
export const mergedDemoRegistry: Registry = {
  ...demoShellRegistry,
  ...formRegistry,
  ...chatbotRegistry,
  ...graphViewRegistry,
  ...storyRegistry,
  ...composedRegistry,
  ...tabManagerRegistry,
};
