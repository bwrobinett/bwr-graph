import { addNode, insertLink, setContext } from "../../graph/slice";
import { store } from "../store";
import { composedContext, NODE_TYPE_COMPOSED } from "./schema";
import { NODE_TYPE_MESSAGE, NODE_TYPE_CONVERSATION } from "../chatbot/schema";

/**
 * Seed the composed showcase: one `Composed` root node linking to every
 * showcase's root via `panels`, plus a dedicated "demo" conversation that
 * contains the cross-schema embed.
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
 *
 * Idempotent — uses `addNode`, which is a no-op for existing ids.
 */
export function seedComposed(): void {
  store.dispatch(setContext({ context: composedContext, merge: true }));

  // Dedicated conversation for the composed view — separate from `conv-1`.
  store.dispatch(
    addNode({
      id: "conv-composed-1",
      type: NODE_TYPE_CONVERSATION,
      title: "Cross-schema demo chat",
      messages: [],
    }),
  );

  // A user message (literal text only) and a system message (literal text +
  // a cross-schema embed of the Form root). Both rendered through the chatbot
  // registry, but the system message's embed reaches into the form schema.
  store.dispatch(
    addNode({
      id: "msg-composed-intro",
      type: NODE_TYPE_MESSAGE,
      role: "user",
      content: "Can you show me the intake form?",
      parent: ["conv-composed-1"],
    }),
  );
  store.dispatch(
    addNode({
      id: "msg-composed-embed",
      type: NODE_TYPE_MESSAGE,
      role: "system",
      content: "Here it is — rendered inside this message through the merged registry:",
      parent: ["conv-composed-1"],
      embed: [],
    }),
  );

  // Real insertLink calls for both the messages-list and the cross-schema
  // embed. Mirrors what `MessageInputView` would do at runtime.
  store.dispatch(
    insertLink({
      targetId: "msg-composed-intro",
      at: { nodeId: "conv-composed-1", property: "messages" },
    }),
  );
  store.dispatch(
    insertLink({
      targetId: "msg-composed-embed",
      at: { nodeId: "conv-composed-1", property: "messages" },
    }),
  );
  // The cross-schema link: a chatbot Message embeds a Form node. The form
  // schema knows nothing about chatbot; the chatbot schema knows nothing
  // about forms. The merged registry + `NodeRenderer` make this just work.
  store.dispatch(
    insertLink({
      targetId: "form-1",
      at: { nodeId: "msg-composed-embed", property: "embed" },
    }),
  );

  // The composed root — panels are the showcase roots, in display order.
  store.dispatch(
    addNode({
      id: "composed-1",
      type: NODE_TYPE_COMPOSED,
      title: "Composed showcase",
      panels: [],
    }),
  );
  // Each panel is a real `insertLink` into `composed-1.panels`. The `panels`
  // link is type-agnostic — Form, Conversation, Story, GraphView all coexist
  // in the same ordered list.
  for (const panelId of ["conv-composed-1", "form-1", "story-1", "graph-view-1"]) {
    store.dispatch(
      insertLink({
        targetId: panelId,
        at: { nodeId: "composed-1", property: "panels" },
      }),
    );
  }
}
