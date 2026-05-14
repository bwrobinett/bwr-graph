import type { Registry } from "../renderer/RegistryContext";
import { formRegistry } from "./form/components/registry";
import { chatbotRegistry } from "./chatbot/components/registry";
import { demoShellRegistry } from "./demo/components/registry";
import { graphViewRegistry } from "./graph-view/components/registry";

/**
 * The demo's merged registry: meta-shell + every showcase. Single
 * `RegistryContext.Provider` value at the top of the tree means any node
 * type from any showcase is renderable from any subtree — that's the dogfood
 * point. Two showcases with different schemas can compose in the same graph.
 */
export const mergedDemoRegistry: Registry = {
  ...demoShellRegistry,
  ...formRegistry,
  ...chatbotRegistry,
  ...graphViewRegistry,
};
