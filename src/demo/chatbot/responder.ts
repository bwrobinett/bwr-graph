import type { MessageView } from "./schema";

// Per-call options the responder may consult. Currently just the system
// prompt the conversation node carries. Optional so existing callers and the
// stub responder don't have to change.
export interface ResponderOptions {
  systemPrompt?: string;
}

// A Responder generates the next assistant message given the full history
// (which already includes the latest user turn). The graph store doesn't know
// or care whether this is a stub, a local LLM, or an API call.
export type Responder = (
  history: MessageView[],
  options?: ResponderOptions,
) => Promise<string>;

// Default system prompt used when the conversation node doesn't carry one.
export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful assistant in a chat. Reply concisely.";

// Stub responder — echoes the last user message. Useful for tests and for
// running the CLI without an LLM dependency. Ignores `systemPrompt`.
export const stubResponder: Responder = async (history) => {
  const last = [...history].reverse().find((m) => m.role === "user");
  if (!last) return "(no user message)";
  return `Got it: ${last.content}`;
};

// Browser fetches go through the Vite dev proxy at `/llm/*` so a phone on the
// tailnet can reach mlx-lm (which only binds 127.0.0.1). Node (CLI) hits
// localhost directly.
const LOCAL_LLM_BASE =
  typeof window === "undefined" ? "http://localhost:8080" : "/llm";
const LOCAL_LLM_URL = `${LOCAL_LLM_BASE}/v1/chat/completions`;
const LOCAL_LLM_MODELS_URL = `${LOCAL_LLM_BASE}/v1/models`;
const LOCAL_LLM_MODEL = "mlx-community/Qwen3-4B-Instruct-2507-4bit";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletion {
  choices?: Array<{ message?: { content?: string } }>;
}

// Local LLM responder — POSTs to the mlx-lm server's OpenAI-compatible
// endpoint. Sends the full conversation history each call; the graph store
// is the source of truth, the server is stateless. The system prompt comes
// from the Conversation node (via the caller) and falls back to the default.
export const localLlmResponder: Responder = async (history, options) => {
  const systemPrompt = options?.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(LOCAL_LLM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LOCAL_LLM_MODEL,
      messages,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`local-llm ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as ChatCompletion;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("local-llm returned empty response");
  return content;
};

// Pick a default responder: local-llm if the server responds, else stub.
export async function pickDefaultResponder(): Promise<{
  responder: Responder;
  name: string;
}> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(LOCAL_LLM_MODELS_URL, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) return { responder: localLlmResponder, name: "local-llm" };
  } catch {
    // fall through to stub
  }
  return { responder: stubResponder, name: "stub" };
}
