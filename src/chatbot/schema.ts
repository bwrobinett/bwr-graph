import type { JsonLdContext } from "../graph/types";

// JSON-LD context for chatbot conversations.
//
// `messages` is an ordered link list — preserves turn order across export +
// re-import. `parent` lets a Message link back to its Conversation, but isn't
// dereferenced by getHistory; it's there so a Message standing alone still
// knows where it belongs.
export const chatbotContext: JsonLdContext = {
  "@vocab": "http://bwr-graph.example/chatbot/",
  messages: { "@type": "@id", "@container": "@list" },
  parent: { "@type": "@id" },
};

export const NODE_TYPE_CONVERSATION = "Conversation";
export const NODE_TYPE_MESSAGE = "Message";

export type MessageRole = "user" | "assistant" | "system";

export interface MessageView {
  id: string;
  role: MessageRole;
  content: string;
}
