import { useSelector } from "react-redux";
import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import { shallowArrayEqual } from "./shallowArrayEqual";

export function BrowserWorkspaceView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const savedTabIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "savedTabs"),
    shallowArrayEqual,
  );

  if (!node) return null;

  return (
    <section data-testid={`browser-workspace-${nodeId}`} style={panelStyle}>
      <h3 style={headingStyle}>{String(node.label ?? "Saved tabs")}</h3>
      {savedTabIds.length === 0 ? (
        <p style={emptyStyle}>No saved tabs.</p>
      ) : (
        <div style={listStyle}>
          {savedTabIds.map((id) => (
            <NodeRenderer key={id} nodeId={id} />
          ))}
        </div>
      )}
    </section>
  );
}

const panelStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
  background: "white",
};

const headingStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 14,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const emptyStyle: React.CSSProperties = {
  margin: 0,
  color: "#667085",
  fontSize: 13,
};
