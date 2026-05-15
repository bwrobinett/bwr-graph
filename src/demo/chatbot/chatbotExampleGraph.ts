import type { GraphDocument } from "../../graph/types";
import { chatbotSchema } from "./schema";

export const chatbotExampleGraph = {
  context: chatbotSchema.context,
  nodes: {
    "conv-1": {
      id: "conv-1",
      type: "Conversation",
      title: "bwr-graph chat",
      messages: [],
    },
  },
} satisfies GraphDocument;
