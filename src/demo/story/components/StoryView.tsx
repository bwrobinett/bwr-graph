import { useSelector } from "react-redux";
import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import { NodeRenderer } from "../../../renderer/NodeRenderer";

/**
 * Top-level renderer for a `Story` node. Walks `scenes` (ordered link list)
 * and `characters` (set) via `NodeRenderer` — each node decides its own
 * appearance via the registry. Same shape as `ConversationView` / `Form`;
 * just a different vocab.
 */
export function StoryView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const sceneIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "scenes"),
    shallowArrayEqual,
  );
  const characterIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "characters"),
    shallowArrayEqual,
  );
  if (!node) return null;

  return (
    <section data-testid={`story-${nodeId}`} style={shellStyle}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          {String(node.title ?? "Story")}
        </h2>
        <small style={countStyle}>
          {sceneIds.length} scene{sceneIds.length === 1 ? "" : "s"} ·{" "}
          {characterIds.length} character
          {characterIds.length === 1 ? "" : "s"}
        </small>
      </header>
      <div data-testid={`story-${nodeId}-characters`} style={charListStyle}>
        {characterIds.length === 0 ? (
          <p style={emptyStyle}>No characters yet.</p>
        ) : (
          characterIds.map((id) => <NodeRenderer key={id} nodeId={id} />)
        )}
      </div>
      <div data-testid={`story-${nodeId}-scenes`} style={sceneListStyle}>
        {sceneIds.length === 0 ? (
          <p style={emptyStyle}>No scenes yet.</p>
        ) : (
          sceneIds.map((id) => <NodeRenderer key={id} nodeId={id} />)
        )}
      </div>
    </section>
  );
}

function shallowArrayEqual(a: readonly string[], b: readonly string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const shellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 16,
  borderRadius: 8,
  maxWidth: 640,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 12,
  gap: 12,
};

const countStyle: React.CSSProperties = {
  color: "#888",
  fontSize: 12,
};

const charListStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 12,
};

const sceneListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const emptyStyle: React.CSSProperties = {
  color: "#888",
  fontStyle: "italic",
  margin: 0,
};
