import { graphDocument } from "../../graph/document";
import type { GraphDocument } from "../../graph/types";
import { composedContext, NODE_TYPE_COMPOSED } from "./schema";
import { NODE_TYPE_MESSAGE, NODE_TYPE_CONVERSATION } from "../chatbot/schema";

/**
 * Portable composed showcase document: one `Composed` root node linking to
 * every showcase's root via `panels`, plus a dedicated "demo" conversation
 * that contains the cross-schema embed.
 *
 * The cross-schema link:
 *   `conv-composed-1` has a system Message (`msg-composed-embed`) whose
 *   `embed` link points at `form-1` (the Form root from the form showcase).
 *   When rendered, the MessageView (chatbot schema) dispatches through
 *   `NodeRenderer` + the merged registry, which routes `Form` → the form
 *   renderer. Chatbot doesn't know about Forms; Form doesn't know about
 *   Chatbot. The merged registry is the only thing that connects them.
 *
 * The composed conversation is separate from the main `conv-1` (Chat tab) so
 * the Chat tab stays a clean chatbot-only demo. Same vocabulary, different
 * instance.
 */
export function composedDocument(): GraphDocument {
  return graphDocument(
    [
      {
        id: "conv-composed-1",
        type: NODE_TYPE_CONVERSATION,
        title: "Cross-schema demo chat",
        messages: ["msg-composed-intro", "msg-composed-embed"],
      },
      {
        id: "msg-composed-intro",
        type: NODE_TYPE_MESSAGE,
        role: "user",
        content: "Can you show me the intake form?",
        parent: ["conv-composed-1"],
      },
      {
        id: "msg-composed-embed",
        type: NODE_TYPE_MESSAGE,
        role: "system",
        content: "Here it is — rendered inside this message through the merged registry:",
        parent: ["conv-composed-1"],
        embed: ["form-1"],
      },
      {
        id: "composed-1",
        type: NODE_TYPE_COMPOSED,
        title: "Composed showcase",
        panels: ["conv-composed-1", "form-1", "story-1", "graph-view-1"],
      },
    ],
    composedContext,
  );
}
