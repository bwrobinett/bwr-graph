import { useDispatch, useSelector } from "react-redux";
import { selectNode, type RootState } from "../../../graph/selectors";
import { updateNode } from "../../../graph/slice";

/**
 * Renders one nav button. Clicks dispatch `updateNode` against the parent
 * `DemoApp` node — the active state is graph state, so the click is just a
 * mutation of the same flat node dict everything else reads from.
 *
 * The parent app id is read off the `app` property on the tab so this
 * component stays decoupled from the seed (no hard-coded "app-1").
 */
export function DemoTabView({ nodeId }: { nodeId: string }) {
  const dispatch = useDispatch();
  const tab = useSelector((s: RootState) => selectNode(s, nodeId));
  const appId = useSelector((s: RootState) => {
    const t = selectNode(s, nodeId);
    if (!t) return null;
    const a = t.app;
    if (Array.isArray(a) && typeof a[0] === "string") return a[0];
    return null;
  });
  const isActive = useSelector((s: RootState) => {
    if (!appId) return false;
    const app = selectNode(s, appId);
    if (!app || !tab) return false;
    return app.activeDemo === tab.key;
  });

  if (!tab) return null;
  const tabKey = String(tab.key ?? "");
  const label = String(tab.label ?? tabKey);

  return (
    <button
      type="button"
      onClick={() => {
        if (!appId) return;
        dispatch(updateNode({ id: appId, activeDemo: tabKey }));
      }}
      style={tabStyle(isActive)}
      data-testid={`tab-${tabKey}`}
      data-active={isActive ? "true" : "false"}
    >
      {label}
    </button>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    border: "1px solid #ccc",
    borderRadius: 6,
    background: active ? "#2f6fed" : "white",
    color: active ? "white" : "#333",
    fontSize: 13,
    cursor: "pointer",
  };
}
