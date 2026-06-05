import { useSelector } from "react-redux";
import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../../graph/selectors";

export function SavedTabView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const boundTabId = useSelector((s: RootState) => {
    const ids = selectLinkedIds(s, nodeId, "boundTab");
    return ids[0] ?? null;
  });

  if (!node) return null;

  return (
    <article data-testid={`saved-tab-${nodeId}`} style={rowStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={labelStyle}>{String(node.label ?? node.url ?? "Untitled")}</div>
        <div style={urlStyle}>{String(node.url ?? "")}</div>
      </div>
      {boundTabId ? <span style={badgeStyle}>open</span> : null}
    </article>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  border: "1px solid #edf0f3",
  borderRadius: 6,
  padding: "8px 10px",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const urlStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: 12,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const badgeStyle: React.CSSProperties = {
  border: "1px solid #b7e1c0",
  background: "#eefbf1",
  borderRadius: 999,
  color: "#2f7a3d",
  fontSize: 11,
  padding: "2px 6px",
  flex: "0 0 auto",
};
