import { useSelector } from "react-redux";
import { selectLinkedIds, selectNode, type RootState } from "../graph/selectors";
import { NodeRenderer } from "../renderer/NodeRenderer";

export function Form({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const childIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "children"),
    shallowArrayEqual,
  );
  if (!node) return null;

  return (
    <form data-testid={`form-${nodeId}`} style={formStyle}>
      <h2 style={{ margin: "0 0 12px" }}>{String(node.title ?? "Untitled form")}</h2>
      {childIds.map((id) => (
        <NodeRenderer key={id} nodeId={id} />
      ))}
    </form>
  );
}

function shallowArrayEqual(a: readonly string[], b: readonly string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const formStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 16,
  borderRadius: 8,
  maxWidth: 480,
};
