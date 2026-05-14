import { useSelector } from "react-redux";
import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import { NodeRenderer } from "../../../renderer/NodeRenderer";

/**
 * Top-level renderer for the demo shell. The whole demo nav lives in the
 * graph: this component reads the `tabs` link list + scalar `activeDemo` key
 * off the `DemoApp` node, walks the tabs to find the active one, and hands
 * its `target` (the root node id of a showcase) to a child `NodeRenderer`.
 *
 * No `useState` / `useEffect` / hash listening — that's all in the store
 * subscriber (see `../hashSync.ts`).
 */
export function DemoAppView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const tabIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "tabs"),
    shallowArrayEqual,
  );
  const activeDemo = useSelector(
    (s: RootState) => selectNode(s, nodeId)?.activeDemo,
  );
  // Find the active tab's target. Resolved off the store so changes to either
  // `activeDemo` or any tab's `target` re-render the showcase area.
  const activeTargetId = useSelector((s: RootState) => {
    const ids = selectLinkedIds(s, nodeId, "tabs");
    for (const tabId of ids) {
      const tab = selectNode(s, tabId);
      if (tab && tab.key === activeDemo) {
        const target = tab.target;
        if (Array.isArray(target) && typeof target[0] === "string") {
          return target[0];
        }
      }
    }
    return null;
  });

  if (!node) return null;

  return (
    <main data-testid={`demo-app-${nodeId}`} style={shellStyle}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>{String(node.title ?? "bwr-graph demo")}</h1>
        <nav style={navStyle} data-testid={`demo-app-${nodeId}-nav`}>
          {tabIds.map((id) => (
            <NodeRenderer key={id} nodeId={id} />
          ))}
        </nav>
      </header>
      {activeTargetId ? (
        <NodeRenderer nodeId={activeTargetId} />
      ) : (
        <p style={emptyStyle}>No active demo selected.</p>
      )}
    </main>
  );
}

function shallowArrayEqual(a: readonly string[], b: readonly string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const shellStyle: React.CSSProperties = {
  fontFamily: "system-ui",
  padding: 24,
  maxWidth: 720,
  margin: "0 auto",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 8,
};

const emptyStyle: React.CSSProperties = {
  color: "#888",
  fontStyle: "italic",
};
