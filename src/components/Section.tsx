import { useSelector } from "react-redux";
import { selectLinkedIds, selectNode, type RootState } from "../graph/selectors";
import { NodeRenderer } from "../renderer/NodeRenderer";

export function Section({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const childIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "children"),
    shallowArrayEqual,
  );
  if (!node) return null;

  return (
    <fieldset data-testid={`section-${nodeId}`} style={sectionStyle}>
      <legend style={{ fontWeight: 600 }}>{String(node.title ?? "")}</legend>
      {childIds.map((id) => (
        <NodeRenderer key={id} nodeId={id} />
      ))}
    </fieldset>
  );
}

function shallowArrayEqual(a: readonly string[], b: readonly string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const sectionStyle: React.CSSProperties = {
  border: "1px solid #eee",
  padding: 12,
  borderRadius: 6,
  margin: "8px 0",
};
