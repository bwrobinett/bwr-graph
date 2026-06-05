import { useDispatch, useSelector, useStore } from "react-redux";
import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import { executeBrowserCommand } from "../browserCommands";

export function TabManagerButtonView({ nodeId }: { nodeId: string }) {
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const commandId = useSelector((s: RootState) => {
    const ids = selectLinkedIds(s, nodeId, "command");
    return ids[0] ?? null;
  });

  if (!node) return null;

  return (
    <button
      type="button"
      data-testid={`tab-manager-button-${nodeId}`}
      onClick={() => {
        if (!commandId) return;
        executeBrowserCommand(dispatch, store.getState, commandId);
      }}
      style={buttonStyle}
    >
      {String(node.label ?? "Command")}
    </button>
  );
}

const buttonStyle: React.CSSProperties = {
  border: "1px solid #b7c3d0",
  background: "white",
  color: "#1f2937",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
  padding: "7px 10px",
};
