import { createContext } from "react";
import type { ComponentType } from "react";

/** A renderer for one node type — receives `nodeId` and pulls its own data via selectors. */
export type NodeComponent = ComponentType<{ nodeId: string }>;

/** Map from node `type` string to the component that renders it. */
export type Registry = Record<string, NodeComponent>;

/**
 * Provides the active registry to `NodeRenderer`. Apps wrap their tree in
 * `<RegistryContext.Provider value={...}>`; nested subtrees can swap in
 * different components via `RegistryOverride`.
 */
export const RegistryContext = createContext<Registry>({});
