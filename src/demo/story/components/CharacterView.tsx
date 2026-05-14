import { useSelector } from "react-redux";
import { selectNode, type RootState } from "../../../graph/selectors";

/**
 * Renders a single `Character` node as a chip. Used both standalone (the
 * Story-level cast list) and embedded inside a Scene's cast — same node id
 * resolves to the same chip in both places (one node, many inbound link
 * slots), which is the point of the story showcase.
 */
export function CharacterView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  if (!node) return null;
  const name = String(node.name ?? "");
  const description =
    typeof node.description === "string" && node.description.length > 0
      ? node.description
      : null;
  return (
    <span
      data-testid={`character-${nodeId}`}
      style={chipStyle}
      title={description ?? undefined}
    >
      {name}
    </span>
  );
}

const chipStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 999,
  background: "#eef3ff",
  color: "#2f4f9e",
  fontSize: 12,
  border: "1px solid #cdd9f3",
};
