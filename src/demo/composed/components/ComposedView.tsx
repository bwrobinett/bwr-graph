import { useSelector } from "react-redux";
import {
  selectLinkedIds,
  selectNode,
  selectNodeType,
  type RootState,
} from "../../../graph/selectors";
import { NodeRenderer } from "../../../renderer/NodeRenderer";

/**
 * Top-level renderer for the composed showcase. Walks `panels` (an ordered
 * link list) and renders each panel through `NodeRenderer` against the
 * surrounding merged registry — so a Form, a Conversation, a Story, and a
 * GraphView can all sit in one page, each rendered by its own showcase's
 * components.
 *
 * The label on each panel header is just the panel's node type — that's the
 * cross-schema demo at a glance: four different `type` values, four
 * different vocabularies, one registry resolving them all.
 */
export function ComposedView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const panelIds = useSelector(
    (s: RootState) => selectLinkedIds(s, nodeId, "panels"),
    shallowArrayEqual,
  );

  if (!node) return null;

  return (
    <section data-testid={`composed-${nodeId}`} style={shellStyle}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: 18 }}>
          {String(node.title ?? "Composed")}
        </h2>
        <small style={leadStyle}>
          Four schemas, one store, one registry. Each panel is a real link from
          the `Composed` node into another showcase's subgraph. The system
          message in the chat panel uses an `embed` link to reach across into
          the form schema — chatbot doesn't know it's rendering a Form.
        </small>
      </header>
      <div data-testid={`composed-${nodeId}-panels`} style={panelsStyle}>
        {panelIds.length === 0 ? (
          <p style={emptyStyle}>No panels.</p>
        ) : (
          panelIds.map((id) => <Panel key={id} panelId={id} />)
        )}
      </div>
    </section>
  );
}

function Panel({ panelId }: { panelId: string }) {
  const type = useSelector((s: RootState) => selectNodeType(s, panelId));
  return (
    <div data-testid={`composed-panel-${panelId}`} style={panelStyle}>
      <div style={panelHeaderStyle}>
        <span style={panelTypeStyle}>{type ?? "?"}</span>
        <span style={panelIdStyle}>#{panelId}</span>
      </div>
      <div style={panelBodyStyle}>
        <NodeRenderer nodeId={panelId} />
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

const shellStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const leadStyle: React.CSSProperties = {
  color: "#555",
  fontSize: 13,
  lineHeight: 1.5,
};

const panelsStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const panelStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  borderRadius: 10,
  padding: 12,
  background: "#fff",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: 8,
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: "1px dashed #e0e0e0",
};

const panelTypeStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 4,
  background: "#2f6fed",
  color: "white",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const panelIdStyle: React.CSSProperties = {
  color: "#888",
  fontSize: 11,
  fontFamily: "monospace",
};

const panelBodyStyle: React.CSSProperties = {
  // No max-width constraint here — let each showcase's own root component
  // decide its layout. This panel is a frame, not a layout manager.
};

const emptyStyle: React.CSSProperties = {
  color: "#888",
  fontStyle: "italic",
  margin: 0,
};
