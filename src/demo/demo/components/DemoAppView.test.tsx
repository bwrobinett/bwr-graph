import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import {
  graphReducer,
  addNode,
  setContext,
} from "../../../graph/slice";
import { RegistryContext, type Registry } from "../../../renderer/RegistryContext";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import { demoShellContext } from "../schema";
import { demoShellRegistry } from "./registry";

// Two trivial showcase types so DemoAppView has something to dispatch into
// when it resolves the active tab's `target`. Tests don't need real form/chat
// renderers — just enough to assert the active subtree is what we asked for.
const DummyA = ({ nodeId }: { nodeId: string }) => (
  <div data-testid={`dummy-a-${nodeId}`}>A:{nodeId}</div>
);
const DummyB = ({ nodeId }: { nodeId: string }) => (
  <div data-testid={`dummy-b-${nodeId}`}>B:{nodeId}</div>
);

const testRegistry: Registry = {
  ...demoShellRegistry,
  DummyA,
  DummyB,
};

function makeShellStore(initialActive = "a") {
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(setContext({ context: demoShellContext }));

  // Two showcase root nodes the tabs point at.
  store.dispatch(addNode({ id: "showcase-a", type: "DummyA", label: "alpha" }));
  store.dispatch(addNode({ id: "showcase-b", type: "DummyB", label: "beta" }));

  store.dispatch(
    addNode({
      id: "app-1",
      type: "DemoApp",
      title: "Test app",
      tabs: ["tab-a", "tab-b"],
      activeDemo: initialActive,
    }),
  );
  store.dispatch(
    addNode({
      id: "tab-a",
      type: "DemoTab",
      key: "a",
      label: "Alpha",
      target: ["showcase-a"],
      app: ["app-1"],
    }),
  );
  store.dispatch(
    addNode({
      id: "tab-b",
      type: "DemoTab",
      key: "b",
      label: "Beta",
      target: ["showcase-b"],
      app: ["app-1"],
    }),
  );
  return store;
}

function renderShell(store: ReturnType<typeof makeShellStore>) {
  return render(
    <Provider store={store}>
      <RegistryContext.Provider value={testRegistry}>
        <NodeRenderer nodeId="app-1" />
      </RegistryContext.Provider>
    </Provider>,
  );
}

describe("DemoAppView", () => {
  it("renders the title and a tab button per linked DemoTab", () => {
    const store = makeShellStore();
    renderShell(store);
    expect(screen.getByTestId("demo-app-app-1")).toBeInTheDocument();
    expect(screen.getByText("Test app")).toBeInTheDocument();
    expect(screen.getByTestId("tab-a")).toBeInTheDocument();
    expect(screen.getByTestId("tab-b")).toBeInTheDocument();
  });

  it("renders the active tab's target subtree via NodeRenderer", () => {
    const store = makeShellStore("a");
    renderShell(store);
    expect(screen.getByTestId("dummy-a-showcase-a")).toBeInTheDocument();
    expect(screen.queryByTestId("dummy-b-showcase-b")).not.toBeInTheDocument();
  });

  it("clicking a tab dispatches updateNode and switches the active subtree", () => {
    const store = makeShellStore("a");
    renderShell(store);

    fireEvent.click(screen.getByTestId("tab-b"));

    // Store mutated — activeDemo flipped.
    expect(store.getState().graph.nodes["app-1"].activeDemo).toBe("b");

    // UI followed — Dummy B is now in the tree, Dummy A is gone.
    expect(screen.getByTestId("dummy-b-showcase-b")).toBeInTheDocument();
    expect(screen.queryByTestId("dummy-a-showcase-a")).not.toBeInTheDocument();
  });

  it("falls back to a no-active-demo hint when activeDemo doesn't match any tab", () => {
    const store = makeShellStore("nope");
    renderShell(store);
    expect(screen.getByText(/No active demo selected/i)).toBeInTheDocument();
  });
});

describe("DemoTabView", () => {
  it("marks the active tab via data-active and styles it differently", () => {
    const store = makeShellStore("a");
    renderShell(store);
    expect(screen.getByTestId("tab-a")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("tab-b")).toHaveAttribute("data-active", "false");
  });

  it("clicking an inactive tab dispatches updateNode against its app back-ref", () => {
    const store = makeShellStore("a");
    renderShell(store);

    // Sanity: starts on a.
    expect(store.getState().graph.nodes["app-1"].activeDemo).toBe("a");

    fireEvent.click(screen.getByTestId("tab-b"));
    expect(store.getState().graph.nodes["app-1"].activeDemo).toBe("b");

    // active flips.
    expect(screen.getByTestId("tab-b")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("tab-a")).toHaveAttribute("data-active", "false");
  });
});
