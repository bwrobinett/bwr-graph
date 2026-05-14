import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, addNode, insertLink, setContext } from "../graph/slice";
import { RegistryContext } from "./RegistryContext";
import { NodeRenderer, RegistryOverride } from "./NodeRenderer";
import { GenericNode } from "./GenericNode";
import { formRegistry } from "../demo/form/components/registry";

function makeStore() {
  return configureStore({ reducer: { graph: graphReducer } });
}

function buildSampleForm(store: ReturnType<typeof makeStore>) {
  store.dispatch(setContext({ context: { children: "@id" } }));
  store.dispatch(addNode({ id: "form-1", type: "Form", title: "Demo", children: [] }));
  store.dispatch(addNode({ id: "sec-1", type: "Section", title: "Bio", children: [] }));
  store.dispatch(addNode({ id: "f-name", type: "Field", label: "Full name", value: "" }));
  store.dispatch(insertLink({ targetId: "sec-1", at: { nodeId: "form-1", property: "children" } }));
  store.dispatch(insertLink({ targetId: "f-name", at: { nodeId: "sec-1", property: "children" } }));
}

describe("NodeRenderer", () => {
  it("renders the registry-matched component for a node type", () => {
    const store = makeStore();
    buildSampleForm(store);
    render(
      <Provider store={store}>
        <RegistryContext.Provider value={formRegistry}>
          <NodeRenderer nodeId="form-1" />
        </RegistryContext.Provider>
      </Provider>,
    );
    expect(screen.getByTestId("form-form-1")).toBeInTheDocument();
    expect(screen.getByTestId("section-sec-1")).toBeInTheDocument();
    expect(screen.getByTestId("field-f-name")).toBeInTheDocument();
    expect(screen.getByText("Demo")).toBeInTheDocument();
    expect(screen.getByText("Bio")).toBeInTheDocument();
    expect(screen.getByText("Full name")).toBeInTheDocument();
  });

  it("falls back to GenericNode for unknown types", () => {
    const store = makeStore();
    store.dispatch(addNode({ id: "weird", type: "UnknownThing", payload: 42 }));
    render(
      <Provider store={store}>
        <RegistryContext.Provider value={formRegistry}>
          <NodeRenderer nodeId="weird" />
        </RegistryContext.Provider>
      </Provider>,
    );
    expect(screen.getByTestId("generic-weird")).toBeInTheDocument();
    expect(screen.getByText("UnknownThing")).toBeInTheDocument();
  });

  it("renders missing-node UI for a nonexistent id", () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <RegistryContext.Provider value={formRegistry}>
          <NodeRenderer nodeId="ghost" />
        </RegistryContext.Provider>
      </Provider>,
    );
    expect(screen.getByTestId("missing-ghost")).toBeInTheDocument();
  });

  it("dispatches updateNode when a Field input changes", () => {
    const store = makeStore();
    buildSampleForm(store);
    render(
      <Provider store={store}>
        <RegistryContext.Provider value={formRegistry}>
          <NodeRenderer nodeId="form-1" />
        </RegistryContext.Provider>
      </Provider>,
    );
    const input = screen.getByTestId("field-f-name").querySelector("input")!;
    fireEvent.change(input, { target: { value: "Brent" } });
    expect(store.getState().graph.nodes["f-name"].value).toBe("Brent");
  });

  it("RegistryOverride swaps a single component while inheriting the rest", () => {
    const store = makeStore();
    buildSampleForm(store);
    function ShoutField({ nodeId }: { nodeId: string }) {
      return <div data-testid={`shout-${nodeId}`}>SHOUTING</div>;
    }
    render(
      <Provider store={store}>
        <RegistryContext.Provider value={formRegistry}>
          <RegistryOverride overrides={{ Field: ShoutField }}>
            <NodeRenderer nodeId="form-1" />
          </RegistryOverride>
        </RegistryContext.Provider>
      </Provider>,
    );
    // Form + Section come from the parent registry; Field comes from the override.
    expect(screen.getByTestId("form-form-1")).toBeInTheDocument();
    expect(screen.getByTestId("section-sec-1")).toBeInTheDocument();
    expect(screen.getByTestId("shout-f-name")).toBeInTheDocument();
  });
});

describe("GenericNode", () => {
  it("renders properties without id/type", () => {
    const store = makeStore();
    store.dispatch(addNode({ id: "thing", type: "Thing", a: 1, b: "hello" }));
    render(
      <Provider store={store}>
        <GenericNode nodeId="thing" />
      </Provider>,
    );
    const pre = screen.getByTestId("generic-thing").querySelector("pre")!;
    expect(pre.textContent).toContain('"a": 1');
    expect(pre.textContent).toContain('"b": "hello"');
    expect(pre.textContent).not.toContain('"id":');
    expect(pre.textContent).not.toContain('"type":');
  });
});
