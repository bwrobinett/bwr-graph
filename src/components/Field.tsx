import { useDispatch, useSelector } from "react-redux";
import { selectNode, type RootState } from "../graph/selectors";
import { updateNode } from "../graph/slice";

export function Field({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const dispatch = useDispatch();
  if (!node) return null;

  const value = typeof node.value === "string" ? node.value : "";
  const label = String(node.label ?? "");

  return (
    <label data-testid={`field-${nodeId}`} style={fieldStyle}>
      <span style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => dispatch(updateNode({ id: nodeId, value: e.target.value }))}
        style={inputStyle}
      />
    </label>
  );
}

const fieldStyle: React.CSSProperties = {
  display: "block",
  margin: "8px 0",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 14,
  boxSizing: "border-box",
};
