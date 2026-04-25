import { useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { RegistryContext, type Registry } from "./RegistryContext";
import { GenericNode } from "./GenericNode";
import { selectNode, type RootState } from "../graph/selectors";

export function NodeRenderer({ nodeId }: { nodeId: string }) {
  const node = useSelector((state: RootState) => selectNode(state, nodeId));
  const registry = useContext(RegistryContext);

  if (!node) {
    return <GenericNode nodeId={nodeId} missing />;
  }

  const Component = registry[node.type] ?? GenericNode;
  return <Component nodeId={nodeId} />;
}

// Nested override: merges a partial registry on top of the surrounding one.
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
