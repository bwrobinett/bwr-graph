import type { Registry } from "../../../renderer/RegistryContext";
import { NODE_TYPE_COMPOSED } from "../schema";
import { ComposedView } from "./ComposedView";

/**
 * Registry for the composed showcase. Maps `Composed` to `ComposedView`. The
 * merged demo registry (`src/demo/registry.ts`) composes this with every
 * other showcase, which is what makes the cross-schema rendering work.
 */
export const composedRegistry: Registry = {
  [NODE_TYPE_COMPOSED]: ComposedView,
};
