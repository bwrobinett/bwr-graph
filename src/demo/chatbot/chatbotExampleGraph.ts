import { chatbotSchema, type ChatbotGraphDocument } from "./chatbotSchema";

export const chatbotExampleGraph = {
  context: chatbotSchema.context,
  nodes: {
    "conv-1": {
      id: "conv-1",
      type: "Conversation",
      title: "bwr-graph chat (cool)",
      messages: ["message-1", "message-2"],
    },
    "message-1": {
      id: "message-1",
      type: "Message",
      role: "user",
      content: "Hello! how are ou?",
    },
    "message-2": {
      id: "message-2",
      type: "Message",
      role: "assistant",
      content: 'Do you mean "you"?',
    },
  },
} satisfies ChatbotGraphDocument;
