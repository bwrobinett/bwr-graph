import type { Registry } from "../../../renderer/RegistryContext";
import { NODE_TYPE_GRAPH_VIEW } from "../schema";
import { GraphView } from "./GraphView";

/**
 * Registry for the graph-view showcase. Only registers the root `GraphView`
 * node type — the generic-card behavior for arbitrary node types comes from
 * the `RegistryOverride` inside `GraphView` itself, scoped to that subtree.
 *
 * Composed with the per-showcase registries (form, chatbot, demo shell, …) at
 * `../../registry.ts`.
 */
export const graphViewRegistry: Registry = {
  [NODE_TYPE_GRAPH_VIEW]: GraphView,
};
