import type { GraphDocument } from "../../graph/types";
import { composedSchema } from "./schema";

export const composedExampleGraph = {
  context: composedSchema.context,
  nodes: {
    "conv-composed-1": {
      id: "conv-composed-1",
      type: "Conversation",
      title: "Cross-schema demo chat",
      messages: ["msg-composed-intro", "msg-composed-embed"],
    },
    "msg-composed-intro": {
      id: "msg-composed-intro",
      type: "Message",
      role: "user",
      content: "Can you show me the intake form?",
      parent: ["conv-composed-1"],
    },
    "msg-composed-embed": {
      id: "msg-composed-embed",
      type: "Message",
      role: "system",
      content: "Here it is - rendered inside this message through the merged registry:",
      parent: ["conv-composed-1"],
      embed: ["form-1"],
    },
    "composed-1": {
      id: "composed-1",
      type: "Composed",
      title: "Composed showcase",
      panels: ["conv-composed-1", "form-1", "story-1", "graph-view-1"],
    },
  },
} satisfies GraphDocument;
