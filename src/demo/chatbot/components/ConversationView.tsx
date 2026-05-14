import { useContext } from "react";
import { useSelector } from "react-redux";
import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import { ChatbotConfigContext } from "./ChatbotConfigContext";
import { MessageInputView } from "./MessageInputView";

/**
 * Top-level renderer for a `Conversation` node. Walks the `messages` link list
 * via `NodeRenderer` — each message decides its own appearance via the
 * registry. Appends a single `MessageInputView` at the bottom; the rest of
 * the UI is pure graph traversal.
 */
export function ConversationView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const messageIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "messages"),
    shallowArrayEqual,
  );
  const config = useContext(ChatbotConfigContext);
  if (!node) return null;

  return (
    <section data-testid={`conversation-${nodeId}`} style={shellStyle}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          {String(node.title ?? "Conversation")}
        </h2>
        <small style={{ color: "#888" }}>responder: {config.responderName}</small>
      </header>
      <div data-testid={`conversation-${nodeId}-messages`} style={messagesStyle}>
        {messageIds.length === 0 ? (
          <p style={emptyStyle}>No messages yet — say hi.</p>
        ) : (
          messageIds.map((id) => <NodeRenderer key={id} nodeId={id} />)
        )}
      </div>
      <MessageInputView
        conversationId={nodeId}
        responder={config.responder}
        responderName={config.responderName}
        idGen={config.idGen}
      />
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
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 12,
  gap: 12,
};

const messagesStyle: React.CSSProperties = {
  minHeight: 240,
  maxHeight: "60vh",
  overflowY: "auto",
  padding: "4px 2px",
};

const emptyStyle: React.CSSProperties = {
  color: "#888",
  fontStyle: "italic",
  margin: 0,
};
