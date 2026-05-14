import type { Registry } from "../../../renderer/RegistryContext";
import { NODE_TYPE_DEMO_APP, NODE_TYPE_DEMO_TAB } from "../schema";
import { DemoAppView } from "./DemoAppView";
import { DemoTabView } from "./DemoTabView";

/**
 * Registry for the meta-showcase. Composed with the per-showcase registries
 * (form, chatbot, …) at the demo entry point — see `../../registry.ts`.
 */
export const demoShellRegistry: Registry = {
  [NODE_TYPE_DEMO_APP]: DemoAppView,
  [NODE_TYPE_DEMO_TAB]: DemoTabView,
};
