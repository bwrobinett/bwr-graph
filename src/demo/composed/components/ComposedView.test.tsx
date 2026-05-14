import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, addNode, insertLink, setContext } from "../../../graph/slice";
import { RegistryContext, type Registry } from "../../../renderer/RegistryContext";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import { composedContext, NODE_TYPE_COMPOSED } from "../schema";
import { composedRegistry } from "./registry";

// Stand-in showcase types — keep this test focused on the cross-schema
// dispatch contract, not on the real form/chatbot/story renderers. Each is a
// distinct node `type` with a distinct vocabulary; the merged registry routes
// each panel to the right component purely on `type`.
const DummyForm = ({ nodeId }: { nodeId: string }) => (
  <div data-testid={`dummy-form-${nodeId}`}>FORM:{nodeId}</div>
);
const DummyChat = ({ nodeId }: { nodeId: string }) => (
  <div data-testid={`dummy-chat-${nodeId}`}>CHAT:{nodeId}</div>
);
const DummyStory = ({ nodeId }: { nodeId: string }) => (
  <div data-testid={`dummy-story-${nodeId}`}>STORY:{nodeId}</div>
);

const testRegistry: Registry = {
  ...composedRegistry,
  DummyForm,
  DummyChat,
  DummyStory,
};

function makeStore() {
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(setContext({ context: composedContext }));

  // Three "showcase" roots, each with a different `type` — the merged
  // registry dispatches each to its own component, proving the cross-schema
  // composition.
  store.dispatch(addNode({ id: "f-root", type: "DummyForm" }));
  store.dispatch(addNode({ id: "c-root", type: "DummyChat" }));
  store.dispatch(addNode({ id: "s-root", type: "DummyStory" }));

  store.dispatch(
    addNode({
      id: "composed-1",
      type: NODE_TYPE_COMPOSED,
      title: "Composed",
      panels: [],
    }),
  );
  for (const id of ["f-root", "c-root", "s-root"]) {
    store.dispatch(
      insertLink({
        targetId: id,
        at: { nodeId: "composed-1", property: "panels" },
      }),
    );
  }
  return store;
}

function renderComposed(store: ReturnType<typeof makeStore>) {
  return render(
    <Provider store={store}>
      <RegistryContext.Provider value={testRegistry}>
        <NodeRenderer nodeId="composed-1" />
      </RegistryContext.Provider>
    </Provider>,
  );
}

describe("ComposedView", () => {
  it("renders the title and one panel per linked node", () => {
    const store = makeStore();
    renderComposed(store);
    expect(screen.getByTestId("composed-composed-1")).toBeInTheDocument();
    expect(screen.getByText("Composed")).toBeInTheDocument();
    expect(screen.getByTestId("composed-panel-f-root")).toBeInTheDocument();
    expect(screen.getByTestId("composed-panel-c-root")).toBeInTheDocument();
    expect(screen.getByTestId("composed-panel-s-root")).toBeInTheDocument();
  });

  it("dispatches each panel through the merged registry by node type", () => {
    const store = makeStore();
    renderComposed(store);
    // Different vocabularies, one registry, three different renderers picked
    // by `type` alone. This IS the cross-schema rendering contract.
    expect(screen.getByTestId("dummy-form-f-root")).toBeInTheDocument();
    expect(screen.getByTestId("dummy-chat-c-root")).toBeInTheDocument();
    expect(screen.getByTestId("dummy-story-s-root")).toBeInTheDocument();
  });

  it("panel order follows the panels link list", () => {
    const store = makeStore();
    renderComposed(store);
    const panels = screen
      .getByTestId("composed-composed-1-panels")
      .querySelectorAll("[data-testid^='composed-panel-']");
    expect(Array.from(panels).map((el) => el.getAttribute("data-testid"))).toEqual([
      "composed-panel-f-root",
      "composed-panel-c-root",
      "composed-panel-s-root",
    ]);
  });

  it("shows an empty hint when the composed node has no panels", () => {
    const store = configureStore({ reducer: { graph: graphReducer } });
    store.dispatch(setContext({ context: composedContext }));
    store.dispatch(
      addNode({
        id: "composed-1",
        type: NODE_TYPE_COMPOSED,
        title: "Empty",
        panels: [],
      }),
    );
    renderComposed(store as ReturnType<typeof makeStore>);
    expect(screen.getByText(/no panels/i)).toBeInTheDocument();
  });
});
