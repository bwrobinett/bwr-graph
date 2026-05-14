import { useSelector } from "react-redux";
import { selectNode, type RootState } from "../../graph/selectors";
import type { MessageRole } from "../schema";

/**
 * Renders a single `Message` node as a chat bubble. Style branches on `role`
 * — user vs assistant vs system — but the underlying node shape is identical
 * (one `Message` type, role discriminator). Same `<NodeRenderer />` flow that
 * the form builder uses; the registry maps `Message` → this component.
 */
export function MessageView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  if (!node) return null;

  const role = (node.role as MessageRole) ?? "user";
  const content = typeof node.content === "string" ? node.content : "";
  const style = bubbleStyleFor(role);

  return (
    <div data-testid={`message-${nodeId}`} data-role={role} style={rowStyleFor(role)}>
      <div style={style}>
        <div style={roleLabelStyle}>{role}</div>
        <div style={contentStyle}>{content || (role === "assistant" ? "…" : "")}</div>
      </div>
    </div>
  );
}

function rowStyleFor(role: MessageRole): React.CSSProperties {
  return {
    display: "flex",
    justifyContent: role === "user" ? "flex-end" : "flex-start",
    margin: "6px 0",
  };
}

function bubbleStyleFor(role: MessageRole): React.CSSProperties {
  // Use longhand corner radii throughout so React doesn't warn about mixing
  // shorthand `borderRadius` with longhand corner properties on re-render.
  const base: React.CSSProperties = {
    maxWidth: "78%",
    padding: "8px 12px",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    fontSize: 14,
    lineHeight: 1.4,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };
  if (role === "user") {
    return { ...base, background: "#2f6fed", color: "white", borderBottomRightRadius: 4 };
  }
  if (role === "assistant") {
    return { ...base, background: "#f1f1f3", color: "#111", borderBottomLeftRadius: 4 };
  }
  // system
  return {
    ...base,
    background: "#fff8e1",
    color: "#664d00",
    border: "1px dashed #d4b34a",
    fontStyle: "italic",
  };
}

const roleLabelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  opacity: 0.7,
  marginBottom: 2,
  letterSpacing: 0.5,
};

const contentStyle: React.CSSProperties = {
  fontSize: 14,
};
