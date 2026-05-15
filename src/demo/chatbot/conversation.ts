import { configureStore, type Store } from "@reduxjs/toolkit";
import {
  graphReducer,
  addNode,
  insertLink,
  setContext,
  mergeGraph,
} from "../../graph/slice";
import { selectLinkedNodes } from "../../graph/selectors";
import type { GraphState, NodeId } from "../../graph/types";
import { exportJsonLd } from "../../jsonld/export";
import {
  importJsonLdDocument,
  type JsonLdDocument,
} from "../../jsonld/import";
import {
  chatbotContext,
  NODE_TYPE_CONVERSATION,
  NODE_TYPE_MESSAGE,
  type MessageRole,
  type MessageView,
} from "./schema";

interface RootState {
  graph: GraphState;
}

type ChatbotStore = Store<RootState>;

export interface Chatbot {
  readonly conversationId: NodeId;
  appendMessage(role: MessageRole, content: string): MessageView;
  getHistory(): MessageView[];
  toJsonLd(): JsonLdDocument;
  // For tests / inspection.
  readonly store: ChatbotStore;
}

export interface CreateChatbotOptions {
  conversationId?: NodeId;
  title?: string;
  // Inject for deterministic IDs in tests; defaults to a counter-based gen.
  idGen?: () => string;
}

// Factory: spins up a fresh store, declares the chatbot context, creates a
// Conversation node. Returns an object that wraps store dispatches.
export function createChatbot(options: CreateChatbotOptions = {}): Chatbot {
  const store = configureStore({ reducer: { graph: graphReducer } });
  const idGen = options.idGen ?? makeCounterIdGen();
  const conversationId = options.conversationId ?? "conv-1";
  const title = options.title ?? "Conversation";

  store.dispatch(setContext({ context: chatbotContext }));
  store.dispatch(
    addNode({
      id: conversationId,
      type: NODE_TYPE_CONVERSATION,
      title,
      messages: [],
    }),
  );

  const appendMessage = (role: MessageRole, content: string): MessageView => {
    const id = idGen();
    store.dispatch(
      addNode({
        id,
        type: NODE_TYPE_MESSAGE,
        role,
        content,
        parent: [conversationId],
      }),
    );
    store.dispatch(
      insertLink({
        targetId: id,
        at: { nodeId: conversationId, property: "messages" },
      }),
    );
    return { id, role, content };
  };

  const getHistory = (): MessageView[] => {
    const messages = selectLinkedNodes(store.getState(), conversationId, "messages");
    return messages.map((node) => ({
      id: node.id,
      role: node.role as MessageRole,
      content: node.content as string,
    }));
  };

  const toJsonLd = (): JsonLdDocument =>
    exportJsonLd(store.getState().graph, { rootId: conversationId });

  return { conversationId, appendMessage, getHistory, toJsonLd, store };
}

// Resume a prior chatbot from a JSON-LD doc. Reconstructs the store state.
export async function loadChatbot(
  doc: JsonLdDocument,
  options: { conversationId?: NodeId } = {},
): Promise<Chatbot> {
  const graph = await importJsonLdDocument(doc);
  const nodes = Object.values(graph.nodes);
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(mergeGraph(graph));

  const conversationId =
    options.conversationId ??
    nodes.find((n) => n.type === NODE_TYPE_CONVERSATION)?.id ??
    "conv-1";

  // Continue ID generation past the existing messages.
  const existingNumeric = nodes
    .map((n) => n.id.match(/^msg-(\d+)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]));
  const startAt = existingNumeric.length > 0 ? Math.max(...existingNumeric) + 1 : 1;
  const idGen = makeCounterIdGen(startAt);

  const appendMessage = (role: MessageRole, content: string): MessageView => {
    const id = idGen();
    store.dispatch(
      addNode({
        id,
        type: NODE_TYPE_MESSAGE,
        role,
        content,
        parent: [conversationId],
      }),
    );
    store.dispatch(
      insertLink({
        targetId: id,
        at: { nodeId: conversationId, property: "messages" },
      }),
    );
    return { id, role, content };
  };

  const getHistory = (): MessageView[] => {
    const messages = selectLinkedNodes(store.getState(), conversationId, "messages");
    return messages.map((node) => ({
      id: node.id,
      role: node.role as MessageRole,
      content: node.content as string,
    }));
  };

  const toJsonLd = (): JsonLdDocument =>
    exportJsonLd(store.getState().graph, { rootId: conversationId });

  return { conversationId, appendMessage, getHistory, toJsonLd, store };
}

function makeCounterIdGen(start = 1): () => string {
  let n = start;
  return () => `msg-${n++}`;
}
