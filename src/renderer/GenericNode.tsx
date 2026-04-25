import { useSelector } from "react-redux";
import { selectNode, type RootState } from "../graph/selectors";

// Fallback when no registry entry matches a node type. In development it
// shows the type, id, and raw properties — making unimplemented types visible
// and inspectable. Override per-type to make it disappear.
export function GenericNode({
  nodeId,
  missing,
}: {
  nodeId: string;
  missing?: boolean;
}) {
  const node = useSelector((state: RootState) => selectNode(state, nodeId));

  if (missing || !node) {
    return (
      <div data-testid={`missing-${nodeId}`} style={missingStyle}>
        <code>missing node: {nodeId}</code>
      </div>
    );
  }

  return (
    <div data-testid={`generic-${node.id}`} style={genericStyle}>
      <header style={{ fontWeight: 600 }}>
        {node.type} <small style={{ color: "#888" }}>{node.id}</small>
      </header>
      <pre style={{ margin: 0, fontSize: 12 }}>
        {JSON.stringify(stripIdentity(node), null, 2)}
      </pre>
    </div>
  );
}

function stripIdentity(node: Record<string, unknown>) {
  const { id: _id, type: _type, ...rest } = node;
  return rest;
}

const genericStyle: React.CSSProperties = {
  border: "1px dashed #888",
  padding: 8,
  margin: 4,
  borderRadius: 4,
  fontFamily: "ui-monospace, monospace",
};

const missingStyle: React.CSSProperties = {
  ...genericStyle,
  borderColor: "#c33",
  background: "#fff5f5",
};
