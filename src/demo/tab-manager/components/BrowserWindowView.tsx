import { useSelector } from "react-redux";
import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import { shallowArrayEqual } from "./shallowArrayEqual";

export function BrowserWindowView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const tabIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "tabs"),
    shallowArrayEqual,
  );

  if (!node) return null;

  return (
    <section data-testid={`browser-window-${nodeId}`} style={panelStyle}>
      <header style={headerStyle}>
        <h3 style={headingStyle}>{String(node.label ?? "Browser window")}</h3>
        {node.focused === true ? <span style={badgeStyle}>focused</span> : null}
      </header>
      <div style={listStyle}>
        {tabIds.map((id) => (
          <NodeRenderer key={id} nodeId={id} />
        ))}
      </div>
    </section>
  );
}

const panelStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
  background: "white",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 8,
};

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const badgeStyle: React.CSSProperties = {
  color: "#3956a4",
  background: "#eef2ff",
  border: "1px solid #c7d2fe",
  borderRadius: 999,
  fontSize: 11,
  padding: "2px 6px",
};
