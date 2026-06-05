import { useSelector } from "react-redux";
import { selectLinkedIds, type RootState } from "../../../graph/selectors";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import { shallowArrayEqual } from "./shallowArrayEqual";

export function TabManagerToolbarView({ nodeId }: { nodeId: string }) {
  const childIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "children"),
    shallowArrayEqual,
  );

  return (
    <div data-testid={`tab-manager-toolbar-${nodeId}`} style={toolbarStyle}>
      {childIds.map((id) => (
        <NodeRenderer key={id} nodeId={id} />
      ))}
    </div>
  );
}

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};
