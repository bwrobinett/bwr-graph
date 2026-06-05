import { useSelector } from "react-redux";
import { selectLinkedIds, selectNode, type RootState } from "../../../graph/selectors";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import { shallowArrayEqual } from "./shallowArrayEqual";

export function TabManagerAppView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const childIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "children"),
    shallowArrayEqual,
  );

  if (!node) return null;

  return (
    <section data-testid={`tab-manager-${nodeId}`} style={shellStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={titleStyle}>{String(node.title ?? "Browser graph")}</h2>
          <p style={subtitleStyle}>
            UI, commands, saved tabs, and live browser state are graph nodes.
          </p>
        </div>
      </header>
      <div style={contentStyle}>
        {childIds.map((id) => (
          <NodeRenderer key={id} nodeId={id} />
        ))}
      </div>
    </section>
  );
}

const shellStyle: React.CSSProperties = {
  border: "1px solid #d7dce2",
  borderRadius: 8,
  overflow: "hidden",
  maxWidth: 720,
  background: "#fbfcfd",
};

const headerStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid #e5e8ec",
  background: "#f4f7f9",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
};

const subtitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#667085",
  fontSize: 13,
};

const contentStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  padding: 12,
};
