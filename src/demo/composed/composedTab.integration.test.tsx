import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, addNode, insertLink, setContext } from "../../graph/slice";
import { RegistryContext } from "../../renderer/RegistryContext";
import { NodeRenderer } from "../../renderer/NodeRenderer";
import { mergedDemoRegistry } from "../registry";
import { ChatbotConfigContext } from "../chatbot/components/ChatbotConfigContext";
import { stubResponder } from "../chatbot/responder";
import { composedContext } from "./schema";
import { storyContext } from "../story/schema";
import { formContext } from "../form/schema";
import { chatbotContext } from "../chatbot/schema";
import { demoShellContext } from "../demo/schema";
import { graphViewContext } from "../graph-view/schema";

// End-to-end test driving the real merged registry against a hand-seeded
// store that mirrors what `seedDemoGraph()` builds in production. Uses the
// production registry (not stand-in dummies) so the dispatch contract is
// exactly the one a browser hits.
//
// Why not call `seedDemoGraph()` directly? It mutates the module-level
// singleton in `demo/store.ts`, which would couple tests to module-init
// order. Building a fresh store per test is the standard pattern.
function makeFullStore() {
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(setContext({ context: formContext }));
  store.dispatch(setContext({ context: chatbotContext, merge: true }));
  store.dispatch(setContext({ context: storyContext, merge: true }));
  store.dispatch(setContext({ context: demoShellContext, merge: true }));
  store.dispatch(setContext({ context: graphViewContext, merge: true }));
  store.dispatch(setContext({ context: composedContext, merge: true }));

  // Minimal form subgraph.
  store.dispatch(
    addNode({ id: "f-name", type: "Field", label: "Full name", value: "" }),
  );
  store.dispatch(
    addNode({ id: "form-1", type: "Form", title: "Intake form", children: [] }),
  );
  store.dispatch(
    insertLink({ targetId: "f-name", at: { nodeId: "form-1", property: "children" } }),
  );

  // Minimal chatbot subgraph (the regular Chat tab).
  store.dispatch(
    addNode({ id: "conv-1", type: "Conversation", title: "chat", messages: [] }),
  );

  // Minimal story subgraph.
  store.dispatch(
    addNode({ id: "char-alice", type: "Character", name: "Alice", description: "" }),
  );
  store.dispatch(
    addNode({
      id: "story-1",
      type: "Story",
      title: "Test story",
      scenes: [],
      characters: [],
    }),
  );
  store.dispatch(
    insertLink({
      targetId: "char-alice",
      at: { nodeId: "story-1", property: "characters" },
    }),
  );

  // Graph-view root.
  store.dispatch(
    addNode({ id: "graph-view-1", type: "GraphView", title: "Graph view" }),
  );

  // Composed subgraph + cross-schema embed.
  store.dispatch(
    addNode({
      id: "conv-composed-1",
      type: "Conversation",
      title: "Cross-schema chat",
      messages: [],
    }),
  );
  store.dispatch(
    addNode({
      id: "msg-composed-embed",
      type: "Message",
      role: "system",
      content: "Here it is:",
      parent: ["conv-composed-1"],
      embed: [],
    }),
  );
  store.dispatch(
    insertLink({
      targetId: "msg-composed-embed",
      at: { nodeId: "conv-composed-1", property: "messages" },
    }),
  );
  // The actual cross-schema link — Message → Form.
  store.dispatch(
    insertLink({
      targetId: "form-1",
      at: { nodeId: "msg-composed-embed", property: "embed" },
    }),
  );
  store.dispatch(
    addNode({
      id: "composed-1",
      type: "Composed",
      title: "Composed",
      panels: [],
    }),
  );
  for (const panel of ["conv-composed-1", "form-1", "story-1", "graph-view-1"]) {
    store.dispatch(
      insertLink({ targetId: panel, at: { nodeId: "composed-1", property: "panels" } }),
    );
  }

  // Demo shell — full tab list including the new Composed tab.
  store.dispatch(
    addNode({
      id: "app-1",
      type: "DemoApp",
      title: "bwr-graph demo",
      tabs: [],
      activeDemo: "form",
    }),
  );
  const tabs = [
    { key: "form", label: "Form", targetId: "form-1" },
    { key: "chat", label: "Chat", targetId: "conv-1" },
    { key: "story", label: "Story", targetId: "story-1" },
    { key: "graph-view", label: "Graph View", targetId: "graph-view-1" },
    { key: "composed", label: "Composed", targetId: "composed-1" },
  ];
  for (const tab of tabs) {
    store.dispatch(
      addNode({
        id: `tab-${tab.key}`,
        type: "DemoTab",
        key: tab.key,
        label: tab.label,
        target: [tab.targetId],
        app: ["app-1"],
      }),
    );
    store.dispatch(
      insertLink({ targetId: `tab-${tab.key}`, at: { nodeId: "app-1", property: "tabs" } }),
    );
  }
  return store;
}

function renderShell(store: ReturnType<typeof makeFullStore>) {
  return render(
    <Provider store={store}>
      <ChatbotConfigContext.Provider
        value={{ responder: stubResponder, responderName: "stub" }}
      >
        <RegistryContext.Provider value={mergedDemoRegistry}>
          <NodeRenderer nodeId="app-1" />
        </RegistryContext.Provider>
      </ChatbotConfigContext.Provider>
    </Provider>,
  );
}

describe("composed tab — full demo integration", () => {
  it("renders all five tabs in the shell nav", () => {
    const store = makeFullStore();
    renderShell(store);
    expect(screen.getByTestId("tab-form")).toBeInTheDocument();
    expect(screen.getByTestId("tab-chat")).toBeInTheDocument();
    expect(screen.getByTestId("tab-story")).toBeInTheDocument();
    expect(screen.getByTestId("tab-graph-view")).toBeInTheDocument();
    expect(screen.getByTestId("tab-composed")).toBeInTheDocument();
  });

  it("clicking the Composed tab swaps in the ComposedView", () => {
    const store = makeFullStore();
    renderShell(store);
    // Form is active first; Composed shouldn't be in the DOM yet.
    expect(screen.queryByTestId("composed-composed-1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("tab-composed"));

    expect(store.getState().graph.nodes["app-1"].activeDemo).toBe("composed");
    expect(screen.getByTestId("composed-composed-1")).toBeInTheDocument();
  });

  it("Composed view dispatches every panel through the merged registry", () => {
    const store = makeFullStore();
    renderShell(store);
    fireEvent.click(screen.getByTestId("tab-composed"));

    // Each panel resolved to its showcase's own renderer — by node type alone.
    expect(screen.getByTestId("conversation-conv-composed-1")).toBeInTheDocument();
    // `form-1` actually renders TWICE: once as its own panel, once embedded
    // inside the chat panel's system message. That's the cross-schema link
    // working — different rendering contexts, same node id, one registry.
    expect(screen.getAllByTestId("form-form-1").length).toBe(2);
    expect(screen.getByTestId("story-story-1")).toBeInTheDocument();
    expect(screen.getByTestId("graph-view-graph-view-1")).toBeInTheDocument();
  });

  it("cross-schema embed: chatbot Message renders a Form inside its bubble", () => {
    const store = makeFullStore();
    renderShell(store);
    fireEvent.click(screen.getByTestId("tab-composed"));

    // The system Message in the composed conversation has an `embed` link
    // pointing at `form-1`. The MessageView dispatches it through the merged
    // registry; the form's `Form` component renders. Chatbot doesn't know
    // anything about forms — the merge is the whole bridge.
    expect(
      screen.getByTestId("message-msg-composed-embed-embed-form-1"),
    ).toBeInTheDocument();
    expect(screen.getByText(/embedded · form-1/i)).toBeInTheDocument();
  });
});
