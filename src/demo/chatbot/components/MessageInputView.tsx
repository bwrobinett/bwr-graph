import { useCallback, useRef, useState } from "react";
import { useDispatch, useStore } from "react-redux";
import { addNode, insertLink, updateNode } from "../../../graph/slice";
import {
  selectLinkedNodes,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import {
  NODE_TYPE_MESSAGE,
  type MessageRole,
  type MessageView as MessageViewModel,
} from "../schema";
import type { Responder } from "../responder";

interface MessageInputViewProps {
  /** Conversation node id this input writes into. */
  conversationId: string;
  /** Responder used to generate the assistant reply. */
  responder: Responder;
  /** Optional name shown in the placeholder + status line. */
  responderName?: string;
  /** Optional id generator for deterministic tests. */
  idGen?: () => string;
}

/**
 * The only non-graph-rendered piece of the chat UI. On submit:
 *   1. dispatch addNode (user Message) + insertLink (append to conversation)
 *   2. read history off the graph, hand it to the responder
 *   3. dispatch addNode (assistant Message, empty) + insertLink
 *   4. dispatch updateNode once the reply lands (single-shot for now;
 *      streaming would call updateNode per chunk)
 *
 * Falls back silently to a stub reply if the responder throws (e.g. local-llm
 * down or CORS blocked) so the demo never hard-fails.
 */
export function MessageInputView({
  conversationId,
  responder,
  responderName,
  idGen,
}: MessageInputViewProps) {
  const dispatch = useDispatch();
  const store = useStore<RootState>();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const counterRef = useRef(0);

  const nextId = useCallback((): string => {
    if (idGen) return idGen();
    // Suffix with timestamp + counter so two MessageInputViews in the same
    // store can't collide. (Demo only ever has one, but cheap insurance.)
    counterRef.current += 1;
    return `msg-${Date.now()}-${counterRef.current}`;
  }, [idGen]);

  const readHistory = useCallback((): MessageViewModel[] => {
    const messages = selectLinkedNodes(store.getState(), conversationId, "messages");
    return messages.map((n) => ({
      id: n.id,
      role: n.role as MessageRole,
      content: n.content as string,
    }));
  }, [store, conversationId]);

  const onSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = value.trim();
      if (!text || busy) return;

      setError(null);
      setBusy(true);

      // 1. user turn
      const userId = nextId();
      dispatch(
        addNode({
          id: userId,
          type: NODE_TYPE_MESSAGE,
          role: "user",
          content: text,
          parent: [conversationId],
        }),
      );
      dispatch(
        insertLink({
          targetId: userId,
          at: { nodeId: conversationId, property: "messages" },
        }),
      );
      setValue("");

      // 2. assistant placeholder (empty content; renderer shows "…")
      const assistantId = nextId();
      dispatch(
        addNode({
          id: assistantId,
          type: NODE_TYPE_MESSAGE,
          role: "assistant",
          content: "",
          parent: [conversationId],
        }),
      );
      dispatch(
        insertLink({
          targetId: assistantId,
          at: { nodeId: conversationId, property: "messages" },
        }),
      );

      // 3. ask the responder, fill in the placeholder
      try {
        const history = readHistory().filter((m) => m.id !== assistantId);
        const conversation = selectNode(store.getState(), conversationId);
        const systemPrompt =
          typeof conversation?.systemPrompt === "string"
            ? conversation.systemPrompt
            : undefined;
        const reply = await responder(history, { systemPrompt });
        dispatch(updateNode({ id: assistantId, content: reply }));
      } catch (err) {
        const message = (err as Error).message ?? String(err);
        dispatch(
          updateNode({
            id: assistantId,
            content: `(responder failed: ${message} — try /responder fallback)`,
            role: "system",
          }),
        );
        setError(message);
      } finally {
        setBusy(false);
      }
    },
    [busy, conversationId, dispatch, nextId, readHistory, responder, value],
  );

  return (
    <form
      data-testid={`message-input-${conversationId}`}
      onSubmit={onSubmit}
      style={formStyle}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          busy
            ? `${responderName ?? "responder"} thinking…`
            : "Say something — Enter to send"
        }
        disabled={busy}
        style={inputStyle}
        autoFocus
      />
      <button type="submit" disabled={busy || value.trim().length === 0} style={buttonStyle}>
        Send
      </button>
      {error ? (
        <div data-testid="message-input-error" style={errorStyle}>
          {error}
        </div>
      ) : null}
    </form>
  );
}

const formStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  borderTop: "1px solid #eee",
  padding: "8px 0 0",
  marginTop: 12,
  flexWrap: "wrap",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #2f6fed",
  background: "#2f6fed",
  color: "white",
  borderRadius: 6,
  fontSize: 14,
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  flexBasis: "100%",
  color: "#c33",
  fontSize: 12,
  marginTop: 4,
};
