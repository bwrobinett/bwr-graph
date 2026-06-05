import { useSelector } from "react-redux";
import { selectNode, type RootState } from "../../../graph/selectors";

export function BrowserTabView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  if (!node) return null;

  return (
    <article
      data-testid={`browser-tab-${nodeId}`}
      data-active={node.active === true ? "true" : "false"}
      style={tabStyle(node.active === true)}
    >
      <div style={{ minWidth: 0 }}>
        <div style={labelStyle}>
          {node.pinned === true ? "Pinned · " : ""}
          {String(node.title ?? "Untitled tab")}
        </div>
        <div style={urlStyle}>{String(node.url ?? "")}</div>
      </div>
      {node.active === true ? <span style={activeStyle}>active</span> : null}
    </article>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    border: active ? "1px solid #9db8ff" : "1px solid #edf0f3",
    background: active ? "#f4f7ff" : "white",
    borderRadius: 6,
    padding: "8px 10px",
  };
}

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

const activeStyle: React.CSSProperties = {
  color: "#3956a4",
  fontSize: 11,
  flex: "0 0 auto",
};
