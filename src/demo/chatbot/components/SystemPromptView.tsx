import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateNode } from "../../../graph/slice";
import { selectNode, type RootState } from "../../../graph/selectors";
import { DEFAULT_SYSTEM_PROMPT } from "../responder";

/**
 * Collapsible editor for the conversation's system prompt. The value lives
 * on the Conversation node as a `systemPrompt` property, so it round-trips
 * through JSON-LD export/import like any other node data. Edits dispatch
 * `updateNode` — the responder picks up the new value on the next send.
 */
export function SystemPromptView({ conversationId }: { conversationId: string }) {
  const dispatch = useDispatch();
  const stored = useSelector((s: RootState) => {
    const node = selectNode(s, conversationId);
    return typeof node?.systemPrompt === "string" ? node.systemPrompt : "";
  });
  const [draft, setDraft] = useState(stored);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Keep the textarea in sync if the underlying node changes (e.g. seed
  // re-runs, or a future "load from JSON-LD" hook). Without this, an external
  // edit would be silently masked by the local draft.
  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const dirty = draft !== stored;
  const effective = stored.trim() ? stored : DEFAULT_SYSTEM_PROMPT;

  const onSave = () => {
    dispatch(updateNode({ id: conversationId, systemPrompt: draft }));
    setSavedAt(Date.now());
  };

  const onReset = () => {
    setDraft(stored);
  };

  const onClear = () => {
    dispatch(updateNode({ id: conversationId, systemPrompt: "" }));
  };

  return (
    <details data-testid={`system-prompt-${conversationId}`} style={detailsStyle}>
      <summary style={summaryStyle}>
        System prompt
        <span style={previewStyle}>· {truncate(effective, 60)}</span>
      </summary>
      <div style={bodyStyle}>
        <textarea
          data-testid={`system-prompt-input-${conversationId}`}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (savedAt !== null) setSavedAt(null);
          }}
          placeholder={DEFAULT_SYSTEM_PROMPT}
          rows={4}
          style={textareaStyle}
        />
        <div style={rowStyle}>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty}
            style={primaryButtonStyle}
          >
            Save
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={!dirty}
            style={secondaryButtonStyle}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={stored.length === 0}
            style={secondaryButtonStyle}
            title="Clear so the responder falls back to the default."
          >
            Use default
          </button>
          <span style={statusStyle}>
            {dirty
              ? "unsaved changes"
              : savedAt !== null
                ? "saved"
                : stored.trim()
                  ? "custom prompt in use"
                  : "using default"}
          </span>
        </div>
      </div>
    </details>
  );
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}

const detailsStyle: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 6,
  padding: "6px 10px",
  marginBottom: 12,
  background: "#fafafa",
};

const summaryStyle: React.CSSProperties = {
  cursor: "pointer",
  fontSize: 13,
  color: "#444",
  display: "flex",
  gap: 6,
  alignItems: "baseline",
};

const previewStyle: React.CSSProperties = {
  color: "#888",
  fontStyle: "italic",
  fontSize: 12,
};

const bodyStyle: React.CSSProperties = {
  paddingTop: 8,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  fontFamily: "inherit",
  fontSize: 13,
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  resize: "vertical",
  boxSizing: "border-box",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #2f6fed",
  background: "#2f6fed",
  color: "white",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid #ccc",
  background: "white",
  color: "#333",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};

const statusStyle: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: 12,
  color: "#888",
};
