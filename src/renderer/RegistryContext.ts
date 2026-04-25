import { createContext } from "react";
import type { ComponentType } from "react";

export type NodeComponent = ComponentType<{ nodeId: string }>;

export type Registry = Record<string, NodeComponent>;

export const RegistryContext = createContext<Registry>({});
