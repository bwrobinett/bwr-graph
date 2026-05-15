import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, addNode, insertLink, setContext } from "../../../graph/slice";
import { RegistryContext } from "../../../renderer/RegistryContext";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import { chatbotContext } from "../chatbotSchema";
import { chatbotRegistry } from "./registry";
import { ChatbotConfigContext } from "./ChatbotConfigContext";
import type { Responder } from "../responder";

// Build a store seeded with the chatbot context + a Conversation node. Tests
// drive the same dispatch surface that the components use at runtime.
function makeChatStore() {
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(setContext({ context: chatbotContext }));
  store.dispatch(
    addNode({
      id: "conv-1",
      type: "Conversation",
      title: "Test chat",
      messages: [],
    }),
  );
  return store;
}

function addMessage(
  store: ReturnType<typeof makeChatStore>,
  id: string,
  role: "user" | "assistant" | "system",
  content: string,
) {
  store.dispatch(
    addNode({
      id,
      type: "Message",
      role,
      content,
    }),
  );
  store.dispatch(
    insertLink({ targetId: id, at: { nodeId: "conv-1", property: "messages" } }),
  );
}

function makeIdGen() {
  let n = 100;
  return () => `m${n++}`;
}

function renderConversation(
  store: ReturnType<typeof makeChatStore>,
  responder: Responder,
  idGen = makeIdGen(),
) {
  return render(
    <Provider store={store}>
      <ChatbotConfigContext.Provider
        value={{ responder, responderName: "test", idGen }}
      >
        <RegistryContext.Provider value={chatbotRegistry}>
          <NodeRenderer nodeId="conv-1" />
        </RegistryContext.Provider>
      </ChatbotConfigContext.Provider>
    </Provider>,
  );
}

describe("ConversationView", () => {
  it("renders the conversation title and an empty-state hint", () => {
    const store = makeChatStore();
    renderConversation(store, async () => "ok");
    expect(screen.getByTestId("conversation-conv-1")).toBeInTheDocument();
    expect(screen.getByText("Test chat")).toBeInTheDocument();
    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
  });

  it("renders existing user and assistant messages with role-keyed bubbles", () => {
    const store = makeChatStore();
    addMessage(store, "m1", "user", "Hi");
    addMessage(store, "m2", "assistant", "Hello back");

    renderConversation(store, async () => "unused");

    const user = screen.getByTestId("message-m1");
    const assistant = screen.getByTestId("message-m2");
    expect(user).toHaveAttribute("data-role", "user");
    expect(assistant).toHaveAttribute("data-role", "assistant");
    expect(user).toHaveTextContent("Hi");
    expect(assistant).toHaveTextContent("Hello back");
  });

  it("send dispatches a user Message + triggers the responder + fills in the assistant Message", async () => {
    const store = makeChatStore();
    const responder = vi.fn<Responder>(async (history) => {
      // The responder sees exactly the history through the user turn — the
      // assistant placeholder is filtered out before the call.
      expect(history.map((m) => m.role)).toEqual(["user"]);
      expect(history[0].content).toBe("ping");
      return "pong";
    });

    renderConversation(store, responder);

    const input = screen.getByPlaceholderText(/Say something/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "ping" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    // user turn lands synchronously
    await waitFor(() => {
      const messages = store.getState().graph.nodes["conv-1"].messages as string[];
      expect(messages).toHaveLength(2); // user + assistant placeholder
    });

    // wait for the responder to resolve and the assistant content to update
    await waitFor(() => {
      const assistantId = (store.getState().graph.nodes["conv-1"].messages as string[])[1];
      expect(store.getState().graph.nodes[assistantId].content).toBe("pong");
    });

    expect(responder).toHaveBeenCalledTimes(1);
    expect(screen.getByText("ping")).toBeInTheDocument();
    expect(screen.getByText("pong")).toBeInTheDocument();
  });

  it("responder failure surfaces error state without breaking the conversation", async () => {
    const store = makeChatStore();
    const responder: Responder = async () => {
      throw new Error("boom");
    };

    renderConversation(store, responder);

    const input = screen.getByPlaceholderText(/Say something/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByTestId("message-input-error")).toHaveTextContent("boom");
    });

    // The user message is still in the graph; the assistant placeholder is
    // updated with an error-styled system message rather than left empty.
    const messages = store.getState().graph.nodes["conv-1"].messages as string[];
    expect(messages).toHaveLength(2);
    const assistantId = messages[1];
    const assistantNode = store.getState().graph.nodes[assistantId];
    expect(assistantNode.role).toBe("system");
    expect(String(assistantNode.content)).toContain("boom");
  });

  it("ignores empty input on send", () => {
    const store = makeChatStore();
    const responder = vi.fn<Responder>(async () => "won't run");
    renderConversation(store, responder);

    // The Send button is disabled when the input is empty.
    const button = screen.getByRole("button", { name: /send/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    fireEvent.click(button);
    expect(responder).not.toHaveBeenCalled();
    expect(store.getState().graph.nodes["conv-1"].messages).toEqual([]);
  });
});
