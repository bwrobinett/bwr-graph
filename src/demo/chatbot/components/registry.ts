import type { Registry } from "../../../renderer/RegistryContext";
import { NODE_TYPE_CONVERSATION, NODE_TYPE_MESSAGE } from "../schema";
import { ConversationView } from "./ConversationView";
import { MessageView } from "./MessageView";

/**
 * Registry that maps the chatbot node types onto their renderers. Wrap a
 * `RegistryContext.Provider` with this value for the chat surface (see
 * `App.tsx`). Same shape as `formRegistry` — registry-dispatch all the way
 * down.
 */
export const chatbotRegistry: Registry = {
  [NODE_TYPE_CONVERSATION]: ConversationView,
  [NODE_TYPE_MESSAGE]: MessageView,
};
