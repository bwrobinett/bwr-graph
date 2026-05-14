import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, addNode, setContext } from "../../../graph/slice";
import { RegistryContext, type Registry } from "../../../renderer/RegistryContext";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import { graphViewContext, NODE_TYPE_GRAPH_VIEW } from "../schema";
import { graphViewRegistry } from "./registry";

// A native renderer for `Message` that the graph-view tab should NOT pick up
// — when this same node is rendered inside GraphView, it should appear as a
// generic NodeCard, not this bubble.
const NativeMessage = ({ nodeId }: { nodeId: string }) => (
  <div data-testid={`native-message-${nodeId}`}>NATIVE BUBBLE</div>
);

function makeStore() {
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(setContext({ context: graphViewContext }));
  store.dispatch(
    addNode({
      id: "graph-view-1",
      type: NODE_TYPE_GRAPH_VIEW,
      title: "Graph view",
    }),
  );
  // A few nodes from a hypothetical chatbot showcase, plus the shell.
  store.dispatch(
    addNode({ id: "conv-1", type: "Conversation", title: "Test chat" }),
  );
  store.dispatch(
    addNode({ id: "msg-1", type: "Message", role: "user", content: "Hi" }),
  );
  store.dispatch(
    addNode({ id: "app-1", type: "DemoApp", title: "App", activeDemo: "x" }),
  );
  return store;
}

function renderGraphView(store: ReturnType<typeof makeStore>) {
  // Outer registry includes a native Message renderer. The graph-view tab
  // must override that for nodes rendered *inside* its subtree.
  const outerRegistry: Registry = {
    ...graphViewRegistry,
    Message: NativeMessage,
  };
  return render(
    <Provider store={store}>
      <RegistryContext.Provider value={outerRegistry}>
        <NodeRenderer nodeId="graph-view-1" />
      </RegistryContext.Provider>
    </Provider>,
  );
}

describe("GraphView", () => {
  it("renders its own root and lists every node in the store as a card", () => {
    const store = makeStore();
    renderGraphView(store);

    expect(screen.getByTestId("graph-view-graph-view-1")).toBeInTheDocument();

    const list = screen.getByTestId("graph-view-graph-view-1-list");
    // All four nodes (graph-view-1, conv-1, msg-1, app-1) → 4 cards.
    expect(within(list).getByTestId("node-card-graph-view-1")).toBeInTheDocument();
    expect(within(list).getByTestId("node-card-conv-1")).toBeInTheDocument();
    expect(within(list).getByTestId("node-card-msg-1")).toBeInTheDocument();
    expect(within(list).getByTestId("node-card-app-1")).toBeInTheDocument();
  });

  it("shows a node count in the header", () => {
    const store = makeStore();
    renderGraphView(store);
    // 4 seeded nodes
    expect(screen.getByText(/4 nodes/)).toBeInTheDocument();
  });

  it("renders Message as a generic card here even though a native Message renderer exists in the outer registry", () => {
    // This is the architectural punchline: same node, same store, different
    // registry → different render. The native bubble should NOT appear inside
    // the graph-view tab.
    const store = makeStore();
    renderGraphView(store);

    expect(screen.getByTestId("node-card-msg-1")).toBeInTheDocument();
    expect(screen.queryByTestId("native-message-msg-1")).not.toBeInTheDocument();
    expect(screen.queryByText("NATIVE BUBBLE")).not.toBeInTheDocument();
  });

  it("includes graph-view-1 itself in the list — the view is meta-visible", () => {
    const store = makeStore();
    renderGraphView(store);
    expect(screen.getByTestId("node-card-graph-view-1")).toBeInTheDocument();
  });
});
