import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, addNode, insertLink, setContext } from "../../graph/slice";
import { RegistryContext, type Registry } from "../../renderer/RegistryContext";
import { NodeRenderer } from "../../renderer/NodeRenderer";
import { chatbotContext } from "../chatbot/chatbotSchema";
import { chatbotRegistry } from "../chatbot/components/registry";
import { formContext } from "../form/formSchema";
import { formRegistry } from "../form/components/registry";
import { ChatbotConfigContext } from "../chatbot/components/ChatbotConfigContext";
import { stubResponder } from "../chatbot/responder";

/**
 * The core cross-schema test: a chatbot Message has an `embed` link pointing
 * at a Form node. Rendering walks chatbot's MessageView, which dispatches the
 * embedded node id through `NodeRenderer` + the *merged* registry — and
 * lands in form's `Form` component. No hardcoded "if this is a Form..."
 * branch anywhere; just node-type dispatch.
 *
 * If this test ever fails, the merged-registry punchline is broken.
 */
describe("cross-schema embed (chatbot Message → Form)", () => {
  const mergedRegistry: Registry = {
    ...chatbotRegistry,
    ...formRegistry,
  };

  function makeStore() {
    const store = configureStore({ reducer: { graph: graphReducer } });
    // Both schemas active in one context. `embed` and `children` are link
    // properties from different vocabularies; both work because the reducer
    // doesn't care which schema a property came from.
    store.dispatch(setContext({ context: chatbotContext }));
    store.dispatch(setContext({ context: formContext, merge: true }));

    // Form subgraph.
    store.dispatch(
      addNode({
        id: "f-name",
        type: "Field",
        label: "Full name",
        value: "",
      }),
    );
    store.dispatch(
      addNode({
        id: "form-1",
        type: "Form",
        title: "Intake form",
        children: [],
      }),
    );
    store.dispatch(
      insertLink({
        targetId: "f-name",
        at: { nodeId: "form-1", property: "children" },
      }),
    );

    // Chatbot subgraph — one Conversation with one Message that embeds the
    // form root via the `embed` link property.
    store.dispatch(
      addNode({
        id: "conv-1",
        type: "Conversation",
        title: "demo",
        messages: [],
      }),
    );
    store.dispatch(
      addNode({
        id: "msg-1",
        type: "Message",
        role: "system",
        content: "Here's the form:",
        embed: [],
      }),
    );
    store.dispatch(
      insertLink({
        targetId: "msg-1",
        at: { nodeId: "conv-1", property: "messages" },
      }),
    );
    store.dispatch(
      insertLink({
        targetId: "form-1",
        at: { nodeId: "msg-1", property: "embed" },
      }),
    );
    return store;
  }

  function renderTree(store: ReturnType<typeof makeStore>) {
    return render(
      <Provider store={store}>
        <ChatbotConfigContext.Provider
          value={{ responder: stubResponder, responderName: "stub" }}
        >
          <RegistryContext.Provider value={mergedRegistry}>
            <NodeRenderer nodeId="conv-1" />
          </RegistryContext.Provider>
        </ChatbotConfigContext.Provider>
      </Provider>,
    );
  }

  it("renders the chatbot Message AND the embedded Form via the merged registry", () => {
    const store = makeStore();
    renderTree(store);

    // Chatbot's own rendering still works.
    expect(screen.getByTestId("message-msg-1")).toBeInTheDocument();
    expect(screen.getByText("Here's the form:")).toBeInTheDocument();

    // The cross-schema embed surfaces a labelled frame.
    expect(screen.getByTestId("message-msg-1-embeds")).toBeInTheDocument();
    expect(screen.getByTestId("message-msg-1-embed-form-1")).toBeInTheDocument();
    expect(screen.getByText(/embedded · form-1/i)).toBeInTheDocument();

    // And inside the embed frame — the form schema's renderer mounts: the
    // Form title and its child Field both come from the form registry.
    expect(screen.getByTestId("form-form-1")).toBeInTheDocument();
    expect(screen.getByText("Intake form")).toBeInTheDocument();
    expect(screen.getByTestId("field-f-name")).toBeInTheDocument();
  });

  it("Message without an embed link still renders normally (no embed frame)", () => {
    const store = makeStore();
    // Remove the embed link.
    store.dispatch(
      addNode({
        id: "msg-2",
        type: "Message",
        role: "user",
        content: "plain message",
      }),
    );
    store.dispatch(
      insertLink({
        targetId: "msg-2",
        at: { nodeId: "conv-1", property: "messages" },
      }),
    );

    renderTree(store);

    expect(screen.getByTestId("message-msg-2")).toBeInTheDocument();
    expect(screen.queryByTestId("message-msg-2-embeds")).not.toBeInTheDocument();
  });
});
