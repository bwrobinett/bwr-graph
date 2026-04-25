import { useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { RegistryContext, type Registry } from "./RegistryContext";
import { GenericNode } from "./GenericNode";
import { selectNode, type RootState } from "../graph/selectors";

/**
 * Render a node by looking up its `type` in the active registry. Falls back
 * to `GenericNode` when the type isn't registered or the node id is unknown
 * — so the tree always renders something inspectable, even mid-build.
 */
export function NodeRenderer({ nodeId }: { nodeId: string }) {
  const node = useSelector((state: RootState) => selectNode(state, nodeId));
  const registry = useContext(RegistryContext);

  if (!node) {
    return <GenericNode nodeId={nodeId} missing />;
  }

  const Component = registry[node.type] ?? GenericNode;
  return <Component nodeId={nodeId} />;
}

/**
 * Layer extra/replacement components onto the surrounding registry for the
 * children of this provider. Useful for context-specific rendering (e.g. a
 * read-only variant inside a preview pane) without rebuilding the whole
 * registry.
 */
export function RegistryOverride({
  overrides,
  children,
}: {
  overrides: Registry;
  children: React.ReactNode;
}) {
  const parent = useContext(RegistryContext);
  const merged = useMemo(() => ({ ...parent, ...overrides }), [parent, overrides]);
  return <RegistryContext.Provider value={merged}>{children}</RegistryContext.Provider>;
}
