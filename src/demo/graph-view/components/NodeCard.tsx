import { useState } from "react";
import { useSelector } from "react-redux";
import {
  selectContext,
  selectNode,
  type RootState,
} from "../../../graph/selectors";
import { isLinkProperty } from "../../../graph/context";

/**
 * Generic, type-agnostic renderer for any graph node. Reflects on the node's
 * own properties using the merged JSON-LD `@context` from the store to decide
 * which arrays are link arrays (rendered as expandable nested cards) vs literal
 * values (rendered as JSON).
 *
 * This is the punchline of the graph-view showcase: a chatbot `Message` is a
 * chat bubble in the chat tab, but in this tab the *same node* is just a card
 * — because the registry differs, not the data.
 */
export function NodeCard({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const context = useSelector(selectContext);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!node) {
    return (
      <div data-testid={`node-card-missing-${nodeId}`} style={missingStyle}>
        <code>missing node: {nodeId}</code>
      </div>
    );
  }

  // Stable, deterministic key order so the card output is testable. Always
  // show id + type first, then everything else alphabetically.
  const props = Object.keys(node)
    .filter((k) => k !== "id" && k !== "type")
    .sort();

  return (
    <article data-testid={`node-card-${nodeId}`} style={cardStyle}>
      <header style={headerStyle}>
        <span style={typeStyle}>{node.type}</span>
        <code style={idStyle}>{node.id}</code>
      </header>
      {props.length === 0 ? (
        <div style={emptyStyle}>(no properties)</div>
      ) : (
        <dl style={dlStyle} data-testid={`node-card-${nodeId}-props`}>
          {props.map((prop) => {
            const value = node[prop];
            const isLink = isLinkProperty(context, prop);
            const linkIds: string[] | null =
              isLink && Array.isArray(value)
                ? (value.filter(
                    (v) => typeof v === "string",
                  ) as string[])
                : null;

            return (
              <div key={prop} style={rowStyle}>
                <dt style={dtStyle}>{prop}</dt>
                <dd style={ddStyle}>
                  {linkIds ? (
                    <LinkList
                      property={prop}
                      ids={linkIds}
                      expanded={!!expanded[prop]}
                      onToggle={() =>
                        setExpanded((s) => ({ ...s, [prop]: !s[prop] }))
                      }
                    />
                  ) : (
                    <code style={literalStyle}>{formatLiteral(value)}</code>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}
    </article>
  );
}

function LinkList({
  property,
  ids,
  expanded,
  onToggle,
}: {
  property: string;
  ids: string[];
  expanded: boolean;
  onToggle: () => void;
}) {
  if (ids.length === 0) {
    return <em style={dimStyle}>(empty)</em>;
  }
  return (
    <div data-testid={`node-card-link-${property}`}>
      <button
        type="button"
        onClick={onToggle}
        style={toggleStyle}
        data-testid={`node-card-link-${property}-toggle`}
        aria-expanded={expanded}
      >
        {expanded ? "▾" : "▸"} {ids.length} {ids.length === 1 ? "link" : "links"}
      </button>
      <ul style={ulStyle}>
        {ids.map((id) => (
          <li key={id} style={liStyle}>
            <code style={literalStyle}>{id}</code>
          </li>
        ))}
      </ul>
      {expanded && (
        <div style={nestedStyle} data-testid={`node-card-link-${property}-expanded`}>
          {ids.map((id) => (
            <NodeCard key={id} nodeId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Best-effort literal display. Strings render verbatim; everything else goes
 * through JSON.stringify so booleans, numbers, nulls, and literal arrays all
 * survive without throwing.
 */
function formatLiteral(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "10px 12px",
  margin: "6px 0",
  background: "#fafafa",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 12,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 8,
  marginBottom: 6,
};

const typeStyle: React.CSSProperties = {
  fontWeight: 700,
  color: "#2f6fed",
};

const idStyle: React.CSSProperties = {
  color: "#888",
  fontSize: 11,
};

const dlStyle: React.CSSProperties = {
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "baseline",
};

const dtStyle: React.CSSProperties = {
  margin: 0,
  minWidth: 80,
  color: "#555",
  fontWeight: 600,
};

const ddStyle: React.CSSProperties = {
  margin: 0,
  flex: 1,
  minWidth: 0,
  wordBreak: "break-word",
};

const literalStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 3,
  padding: "1px 4px",
};

const emptyStyle: React.CSSProperties = {
  color: "#888",
  fontStyle: "italic",
};

const toggleStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: "#2f6fed",
  font: "inherit",
};

const ulStyle: React.CSSProperties = {
  margin: "2px 0 0 0",
  padding: 0,
  listStyle: "none",
  display: "flex",
  flexWrap: "wrap",
  gap: 4,
};

const liStyle: React.CSSProperties = {
  margin: 0,
};

const nestedStyle: React.CSSProperties = {
  marginTop: 6,
  marginLeft: 12,
  paddingLeft: 8,
  borderLeft: "2px solid #ddd",
};

const dimStyle: React.CSSProperties = {
  color: "#888",
};

const missingStyle: React.CSSProperties = {
  border: "1px dashed #c33",
  background: "#fff5f5",
  padding: 8,
  margin: 4,
  borderRadius: 4,
  fontFamily: "ui-monospace, monospace",
  fontSize: 12,
};
