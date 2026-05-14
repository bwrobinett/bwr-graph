import { useSelector } from "react-redux";
import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import type { MessageRole } from "../schema";

/**
 * Renders a single `Message` node as a chat bubble. Style branches on `role`
 * — user vs assistant vs system — but the underlying node shape is identical
 * (one `Message` type, role discriminator). Same `<NodeRenderer />` flow that
 * the form builder uses; the registry maps `Message` → this component.
 *
 * Cross-schema hook: if the Message has an `embed` link (declared in
 * `chatbotContext`), the linked node is rendered inside the bubble via
 * `NodeRenderer`. Chatbot doesn't know or care what node type sits on the
 * other end — the merged registry dispatches it. A Message can embed a Form,
 * a Story scene, another Conversation, anything.
 */
export function MessageView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const embedIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "embed"),
    shallowArrayEqual,
  );
  if (!node) return null;

  const role = (node.role as MessageRole) ?? "user";
  const content = typeof node.content === "string" ? node.content : "";
  const style = bubbleStyleFor(role);

  return (
    <div data-testid={`message-${nodeId}`} data-role={role} style={rowStyleFor(role)}>
      <div style={style}>
        <div style={roleLabelStyle}>{role}</div>
        {content || (role === "assistant" && embedIds.length === 0) ? (
          <div style={contentStyle}>
            {content || (role === "assistant" ? "…" : "")}
          </div>
        ) : null}
        {embedIds.length > 0 ? (
          <div data-testid={`message-${nodeId}-embeds`} style={embedListStyle}>
            {embedIds.map((id) => (
              <div
                key={id}
                data-testid={`message-${nodeId}-embed-${id}`}
                style={embedFrameStyle}
              >
                <div style={embedLabelStyle}>embedded · {id}</div>
                <NodeRenderer nodeId={id} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function shallowArrayEqual(a: readonly string[], b: readonly string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
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

const embedListStyle: React.CSSProperties = {
  marginTop: 8,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

// Visually obvious framing for cross-schema embeds: a dashed accent border +
// "embedded" label so it's clear at a glance the content inside isn't a
// chatbot-native bubble — it's a node from some other schema, rendered
// through the merged registry.
const embedFrameStyle: React.CSSProperties = {
  border: "1.5px dashed #b76cff",
  borderRadius: 8,
  padding: 8,
  background: "rgba(255,255,255,0.7)",
};

const embedLabelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "#7a3fb8",
  marginBottom: 6,
  fontWeight: 600,
};
