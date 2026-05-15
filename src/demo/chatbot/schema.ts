import { z } from "zod";
import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for chatbot conversations.
//
// `messages` is an ordered link list — preserves turn order across export +
// re-import. `parent` lets a Message link back to its Conversation, but isn't
// dereferenced by getHistory; it's there so a Message standing alone still
// knows where it belongs. `embed` is the cross-schema hook: a Message can
// link to any other node (a Form, a Story scene, anything), and the merged
// registry takes care of rendering — chatbot doesn't need to know the
// embedded node's type. The text `content` literal stays as-is; `embed` is
// an additional, optional link that augments the bubble.
export const chatbotContext = {
  "@vocab": "http://bwr-graph.example/chatbot/",
  messages: { "@type": "@id", "@container": "@list" },
  parent: { "@type": "@id" },
  embed: { "@type": "@id" },
} satisfies JsonLdContext;

export const messageRoleSchema = z.enum(["user", "assistant", "system"]);

export const conversationNodeSchema = z.object({
  id: z.string(),
  type: z.literal("Conversation"),
  title: z.string(),
  messages: z.array(z.string()),
  systemPrompt: z.string().optional(),
});

export const messageNodeSchema = z.object({
  id: z.string(),
  type: z.literal("Message"),
  role: messageRoleSchema,
  content: z.string(),
  parent: z.array(z.string()),
  embed: z.array(z.string()).optional(),
});

export const chatbotGraphNodeSchema = z.discriminatedUnion("type", [
  conversationNodeSchema,
  messageNodeSchema,
]);

export const chatbotSchema = {
  context: chatbotContext,
  node: chatbotGraphNodeSchema,
} as const;

export type MessageRole = z.infer<typeof messageRoleSchema>;
export type ChatbotGraphNode = z.infer<typeof chatbotGraphNodeSchema>;
