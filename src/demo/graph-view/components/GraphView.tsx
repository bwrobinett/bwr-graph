import { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  selectNode,
  selectNodes,
  type RootState,
} from "../../../graph/selectors";
import { RegistryOverride } from "../../../renderer/NodeRenderer";
import { NodeCard } from "./NodeCard";

/**
 * Top-level renderer for the graph-view showcase. Reads `state.graph.nodes`
 * and renders every node in the store as a generic `NodeCard` — including
 * itself, the demo shell, every other showcase's nodes, etc.
 *
 * Nests under a `RegistryOverride` that maps every node type to `NodeCard`
 * indirectly: any nested `<NodeRenderer />` calls (e.g. when a card expands a
 * link) pick up `NodeCard` from the override map keyed by node type at render
 * time. Today the cards only call `NodeCard` directly, but the override means
 * any future plumbing that goes through `NodeRenderer` from inside this tab
 * still gets generic cards instead of native renderers.
 */
export function GraphView({ nodeId }: { nodeId: string }) {
  const node = useSelector((s: RootState) => selectNode(s, nodeId));
  const nodes = useSelector(selectNodes);

  // Stable order: by type then id. Keeps the test output deterministic and
  // groups related nodes visually.
  const allIds = useMemo(() => {
    return Object.values(nodes)
      .slice()
      .sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.id.localeCompare(b.id);
      })
      .map((n) => n.id);
  }, [nodes]);

  // Build an override that maps every type currently present to NodeCard. The
  // map is rebuilt only when the set of types changes.
  const allTypes = useMemo(() => {
    const set = new Set<string>();
    for (const n of Object.values(nodes)) set.add(n.type);
    return Array.from(set).sort();
  }, [nodes]);

  const genericOverride = useMemo(() => {
    const out: Record<string, typeof NodeCard> = {};
    for (const t of allTypes) out[t] = NodeCard;
    return out;
  }, [allTypes]);

  if (!node) return null;

  return (
    <RegistryOverride overrides={genericOverride}>
      <section data-testid={`graph-view-${nodeId}`} style={shellStyle}>
        <header style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {String(node.title ?? "Graph view")}
          </h2>
          <small style={countStyle}>
            {allIds.length} {allIds.length === 1 ? "node" : "nodes"}
          </small>
        </header>
        <p style={leadStyle}>
          Every node in the store, rendered generically. Same data as the other
          tabs — different registry.
        </p>
        <div data-testid={`graph-view-${nodeId}-list`} style={listStyle}>
          {allIds.map((id) => (
            <NodeCard key={id} nodeId={id} />
          ))}
        </div>
      </section>
    </RegistryOverride>
  );
}

const shellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: 16,
  borderRadius: 8,
  maxWidth: 720,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 4,
  gap: 12,
};

const countStyle: React.CSSProperties = {
  color: "#888",
  fontSize: 12,
};

const leadStyle: React.CSSProperties = {
  color: "#555",
  fontSize: 13,
  margin: "0 0 12px 0",
};

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};
