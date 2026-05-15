import type { Registry } from "../../../renderer/RegistryContext";
import { DemoAppView } from "./DemoAppView";
import { DemoTabView } from "./DemoTabView";

/**
 * Registry for the meta-showcase. Composed with the per-showcase registries
 * (form, chatbot, …) at the demo entry point — see `../../registry.ts`.
 */
export const demoShellRegistry: Registry = {
  DemoApp: DemoAppView,
  DemoTab: DemoTabView,
};
