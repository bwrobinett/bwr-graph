import { createContext } from "react";
import { stubResponder, type Responder } from "../responder";

/**
 * Config shared with `ConversationView` and its `MessageInputView` child.
 * `NodeRenderer` only passes `nodeId` to registered components, so the
 * responder + status info ride alongside via React context instead of props.
 */
export interface ChatbotConfig {
  responder: Responder;
  responderName: string;
  /** Optional id generator for deterministic tests. */
  idGen?: () => string;
}

export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  responder: stubResponder,
  responderName: "stub",
};

export const ChatbotConfigContext = createContext<ChatbotConfig>(DEFAULT_CHATBOT_CONFIG);
