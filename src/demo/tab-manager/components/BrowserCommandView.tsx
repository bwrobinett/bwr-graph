import { useSelector } from "react-redux";
import { selectNode, type RootState } from "../../../graph/selectors";

export function BrowserCommandView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  if (!node) return null;

  return (
    <code data-testid={`browser-command-${nodeId}`} style={commandStyle}>
      {String(node.action ?? node.label ?? nodeId)}
    </code>
  );
}

const commandStyle: React.CSSProperties = {
  display: "inline-block",
  border: "1px solid #e2e8f0",
  borderRadius: 4,
  padding: "2px 5px",
  fontSize: 12,
};
