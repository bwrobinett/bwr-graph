import { useSelector } from "react-redux";
import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import { NodeRenderer } from "../../../renderer/NodeRenderer";

/**
 * Renders a single `Scene` node — title + body + the cast (via `characters`
 * link, a `@container: @set` so order isn't meaningful). Each character is
 * rendered through `NodeRenderer` so characters reused across scenes get the
 * same display surface every time.
 */
export function SceneView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const characterIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "characters"),
    shallowArrayEqual,
  );
  if (!node) return null;

  return (
    <article data-testid={`scene-${nodeId}`} style={sceneStyle}>
      <h3 style={titleStyle}>{String(node.title ?? "Untitled scene")}</h3>
      <p style={bodyStyle}>{String(node.body ?? "")}</p>
      {characterIds.length > 0 ? (
        <div data-testid={`scene-${nodeId}-cast`} style={castStyle}>
          <span style={castLabel}>cast:</span>
          {characterIds.map((id) => (
            <NodeRenderer key={id} nodeId={id} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

function shallowArrayEqual(a: readonly string[], b: readonly string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const sceneStyle: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 6,
  padding: 12,
  background: "#fafafa",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: 15,
};

const bodyStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: 14,
  color: "#333",
  lineHeight: 1.4,
};

const castStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
  fontSize: 12,
};

const castLabel: React.CSSProperties = {
  color: "#888",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginRight: 4,
};
