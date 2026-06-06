import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateNode } from "../../../graph/slice";
import type { AppDispatch } from "../../store";
import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import { RegistryOverride } from "../../../renderer/NodeRenderer";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import { NodeCard } from "../../graph-view/components/NodeCard";
import {
  selectStoryWriterLiveNodeIds,
  selectStoryWriterMarkdown,
} from "../storyWriterSelectors";

export function StoryWriterView({ nodeId }: { nodeId: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const logIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "logs"),
    shallowArrayEqual,
  );
  const finalStoryId = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "finalStory")[0] ?? null,
  );
  const markdown = useSelector((s: RootState) =>
    selectStoryWriterMarkdown(s, nodeId),
  );
  const liveNodeIds = useSelector(
    (s: RootState) => selectStoryWriterLiveNodeIds(s, nodeId),
    shallowArrayEqual,
  );

  const debugOverride = useMemo(
    () => ({
      StoryWriter: NodeCard,
      StoryWriterLog: NodeCard,
      StoryIdea: NodeCard,
      Story: NodeCard,
      Scene: NodeCard,
      Character: NodeCard,
    }),
    [],
  );

  if (!node) return null;

  return (
    <section data-testid={`story-writer-${nodeId}`} style={shellStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={titleStyle}>{String(node.title ?? "Story writer")}</h2>
          <p style={promptStyle}>{String(node.prompt ?? "")}</p>
        </div>
        <div style={actionsStyle}>
          <StatusBadge status={String(node.status ?? "idle")} />
          <button
            type="button"
            style={buttonStyle}
            disabled={node.status === "running"}
            onClick={() =>
              dispatch(
                updateNode({
                  id: nodeId,
                  status: "idle",
                  storyIdeas: [],
                  finalStory: [],
                  logs: [],
                  error: "",
                  generationNonce: Number(node.generationNonce ?? 0) + 1,
                }),
              )
            }
          >
            Generate new story
          </button>
        </div>
      </header>

      <div style={gridStyle}>
        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Runtime log</h3>
          {logIds.length === 0 ? (
            <p style={emptyStyle}>Waiting for the runtime node to mount.</p>
          ) : (
            <ol data-testid={`story-writer-${nodeId}-logs`} style={logListStyle}>
              {logIds.map((id) => (
                <LogLine key={id} nodeId={id} />
              ))}
            </ol>
          )}
          {node.error ? <p style={errorStyle}>{String(node.error)}</p> : null}
        </section>

        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Live graph</h3>
          <RegistryOverride overrides={debugOverride}>
            <div data-testid={`story-writer-${nodeId}-live-graph`} style={liveGraphStyle}>
              {liveNodeIds.map((id) => (
                <NodeRenderer key={id} nodeId={id} />
              ))}
            </div>
          </RegistryOverride>
        </section>
      </div>

      <div style={gridStyle}>
        <section style={panelStyle}>
          <h3 style={panelTitleStyle}>Markdown projection</h3>
          {markdown ? (
            <pre data-testid={`story-writer-${nodeId}-markdown`} style={markdownStyle}>
              {markdown}
            </pre>
          ) : (
            <p style={emptyStyle}>No final story node yet.</p>
          )}
        </section>
      </div>

      {finalStoryId ? (
        <div style={gridStyle}>
          <section style={panelStyle}>
            <h3 style={panelTitleStyle}>Story registry view</h3>
            <NodeRenderer nodeId={finalStoryId} />
          </section>
          <section style={panelStyle}>
            <h3 style={panelTitleStyle}>Generic graph view</h3>
            <RegistryOverride overrides={debugOverride}>
              <NodeRenderer nodeId={finalStoryId} />
            </RegistryOverride>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function LogLine({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  if (!node) return null;
  return (
    <li data-testid={`story-writer-log-${nodeId}`} style={logItemStyle}>
      <span style={logStepStyle}>{String(node.step ?? "step")}</span>
      <span>{String(node.message ?? "")}</span>
    </li>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span style={{ ...badgeStyle, ...badgeColors(status) }}>{status}</span>;
}

function badgeColors(status: string): React.CSSProperties {
  if (status === "complete") return { borderColor: "#1f8f55", color: "#1f8f55" };
  if (status === "failed") return { borderColor: "#c33", color: "#c33" };
  if (status === "running") return { borderColor: "#b36b00", color: "#8a5200" };
  return { borderColor: "#888", color: "#666" };
}

function shallowArrayEqual(a: readonly string[], b: readonly string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const shellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 8,
  padding: 16,
  maxWidth: 960,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 16,
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 6px",
  fontSize: 18,
};

const promptStyle: React.CSSProperties = {
  margin: 0,
  color: "#555",
  lineHeight: 1.4,
  fontSize: 13,
};

const badgeStyle: React.CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 8px",
  fontSize: 12,
  lineHeight: 1,
  textTransform: "uppercase",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: 8,
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid #2f6fed",
  background: "#2f6fed",
  color: "white",
  borderRadius: 6,
  padding: "7px 10px",
  fontSize: 13,
  cursor: "pointer",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
  marginTop: 12,
};

const panelStyle: React.CSSProperties = {
  minWidth: 0,
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: 14,
  margin: "0 0 8px",
};

const logListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
};

const logItemStyle: React.CSSProperties = {
  marginBottom: 6,
  fontSize: 13,
  lineHeight: 1.35,
};

const logStepStyle: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  color: "#2f6fed",
  marginRight: 6,
};

const markdownStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  border: "1px solid #eee",
  borderRadius: 6,
  padding: 10,
  margin: 0,
  maxHeight: 360,
  overflow: "auto",
  background: "#fafafa",
  fontSize: 12,
  lineHeight: 1.45,
};

const liveGraphStyle: React.CSSProperties = {
  maxHeight: 360,
  overflow: "auto",
  paddingRight: 4,
};

const emptyStyle: React.CSSProperties = {
  color: "#888",
  fontStyle: "italic",
  margin: 0,
};

const errorStyle: React.CSSProperties = {
  color: "#c33",
  fontSize: 12,
};
