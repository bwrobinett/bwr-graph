import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, addNode, setContext } from "../../../graph/slice";
import type { JsonLdContext } from "../../../graph/types";
import { NodeCard } from "./NodeCard";

// One context that mixes link properties + non-link arrays so the card has
// to lean on the @context (not value-shape sniffing) to decide what's a link.
const testContext: JsonLdContext = {
  "@vocab": "http://example/test/",
  children: { "@type": "@id", "@container": "@list" },
  parent: { "@type": "@id" },
  // tags is intentionally NOT declared as a link — even if its value is an
  // array of strings, NodeCard should render it as a literal.
};

function makeStore() {
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(setContext({ context: testContext }));
  return store;
}

function renderCard(
  store: ReturnType<typeof makeStore>,
  rootId: string,
) {
  return render(
    <Provider store={store}>
      <NodeCard nodeId={rootId} />
    </Provider>,
  );
}

describe("NodeCard", () => {
  it("renders a missing node card when the id isn't in the store", () => {
    const store = makeStore();
    renderCard(store, "ghost-1");
    expect(screen.getByTestId("node-card-missing-ghost-1")).toBeInTheDocument();
  });

  it("renders id + type + a row per non-identity property", () => {
    const store = makeStore();
    store.dispatch(
      addNode({
        id: "n1",
        type: "Widget",
        title: "Hello",
        count: 3,
        active: true,
        nullable: null,
      }),
    );

    renderCard(store, "n1");

    const card = screen.getByTestId("node-card-n1");
    expect(within(card).getByText("Widget")).toBeInTheDocument();
    expect(within(card).getByText("n1")).toBeInTheDocument();

    const props = within(card).getByTestId("node-card-n1-props");
    expect(within(props).getByText("title")).toBeInTheDocument();
    expect(within(props).getByText("Hello")).toBeInTheDocument();
    expect(within(props).getByText("count")).toBeInTheDocument();
    expect(within(props).getByText("3")).toBeInTheDocument();
    expect(within(props).getByText("active")).toBeInTheDocument();
    expect(within(props).getByText("true")).toBeInTheDocument();
    expect(within(props).getByText("nullable")).toBeInTheDocument();
    expect(within(props).getByText("null")).toBeInTheDocument();
  });

  it("renders an empty-properties hint when the node has only id + type", () => {
    const store = makeStore();
    store.dispatch(addNode({ id: "bare", type: "Bare" }));
    renderCard(store, "bare");
    expect(screen.getByText("(no properties)")).toBeInTheDocument();
  });

  it("renders link properties (declared in context) as a collapsible link list", () => {
    const store = makeStore();
    store.dispatch(addNode({ id: "p", type: "Parent", children: ["c1", "c2"] }));
    store.dispatch(addNode({ id: "c1", type: "Child", title: "first" }));
    store.dispatch(addNode({ id: "c2", type: "Child", title: "second" }));

    renderCard(store, "p");

    // Link list is present, collapsed initially — child cards not rendered yet.
    expect(screen.getByTestId("node-card-link-children")).toBeInTheDocument();
    expect(screen.queryByTestId("node-card-c1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("node-card-c2")).not.toBeInTheDocument();

    // The two ids are listed inline.
    const list = screen.getByTestId("node-card-link-children");
    expect(within(list).getByText("c1")).toBeInTheDocument();
    expect(within(list).getByText("c2")).toBeInTheDocument();

    // Expand → children rendered as nested NodeCards.
    fireEvent.click(screen.getByTestId("node-card-link-children-toggle"));
    expect(screen.getByTestId("node-card-c1")).toBeInTheDocument();
    expect(screen.getByTestId("node-card-c2")).toBeInTheDocument();

    // Collapse again.
    fireEvent.click(screen.getByTestId("node-card-link-children-toggle"));
    expect(screen.queryByTestId("node-card-c1")).not.toBeInTheDocument();
  });

  it("renders single-link properties (declared as @id, no @container) as a link list", () => {
    const store = makeStore();
    store.dispatch(addNode({ id: "p", type: "Parent" }));
    store.dispatch(addNode({ id: "c", type: "Child", parent: ["p"] }));

    renderCard(store, "c");

    // `parent` is a link property (declared above) so it shows as a link list.
    expect(screen.getByTestId("node-card-link-parent")).toBeInTheDocument();
  });

  it("renders array properties NOT declared as links as literal JSON, not link lists", () => {
    const store = makeStore();
    store.dispatch(
      addNode({ id: "n", type: "Tagged", tags: ["alpha", "beta", "gamma"] }),
    );

    renderCard(store, "n");

    // Should not be a link list…
    expect(screen.queryByTestId("node-card-link-tags")).not.toBeInTheDocument();
    // …it should be rendered as a literal JSON value instead.
    const card = screen.getByTestId("node-card-n");
    expect(within(card).getByText('["alpha","beta","gamma"]')).toBeInTheDocument();
  });

  it("renders empty link arrays with an `(empty)` hint and no toggle", () => {
    const store = makeStore();
    store.dispatch(addNode({ id: "p", type: "Parent", children: [] }));

    renderCard(store, "p");

    expect(screen.queryByTestId("node-card-link-children-toggle")).not.toBeInTheDocument();
    expect(screen.getByText("(empty)")).toBeInTheDocument();
  });

  it("works on any node shape — no per-type knowledge required", () => {
    // The point of NodeCard: same component works for Form, Conversation,
    // Message, DemoApp, … This test exercises three completely different shapes
    // through the same component without any per-type setup.
    const store = makeStore();
    store.dispatch(
      addNode({ id: "form-1", type: "Form", title: "Intake", children: ["s"] }),
    );
    store.dispatch(
      addNode({
        id: "msg-1",
        type: "Message",
        role: "user",
        content: "hi",
      }),
    );
    store.dispatch(
      addNode({
        id: "app-1",
        type: "DemoApp",
        title: "App",
        activeDemo: "form",
      }),
    );

    const { rerender } = renderCard(store, "form-1");
    expect(screen.getByTestId("node-card-form-1")).toBeInTheDocument();
    expect(screen.getByText("Form")).toBeInTheDocument();

    rerender(
      <Provider store={store}>
        <NodeCard nodeId="msg-1" />
      </Provider>,
    );
    expect(screen.getByTestId("node-card-msg-1")).toBeInTheDocument();
    expect(screen.getByText("Message")).toBeInTheDocument();

    rerender(
      <Provider store={store}>
        <NodeCard nodeId="app-1" />
      </Provider>,
    );
    expect(screen.getByTestId("node-card-app-1")).toBeInTheDocument();
    expect(screen.getByText("DemoApp")).toBeInTheDocument();
  });
});
