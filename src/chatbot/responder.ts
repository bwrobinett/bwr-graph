import { spawn } from "node:child_process";
import type { MessageView } from "./schema";

// A Responder generates the next assistant message given the full history
// (which already includes the latest user turn). The graph store doesn't know
// or care whether this is a stub, a local LLM, or an API call.
export type Responder = (history: MessageView[]) => Promise<string>;

// Stub responder — echoes the last user message. Useful for tests and for
// running the CLI without an LLM dependency.
export const stubResponder: Responder = async (history) => {
  const last = [...history].reverse().find((m) => m.role === "user");
  if (!last) return "(no user message)";
  return `Got it: ${last.content}`;
};

// Format chat history as a transcript for a one-shot LLM prompt.
function formatTranscript(history: MessageView[]): string {
  const lines: string[] = [
    "You are a helpful assistant in a chat. Reply concisely.",
    "",
  ];
  for (const m of history) {
    const speaker = m.role === "user" ? "User" : m.role === "assistant" ? "Assistant" : "System";
    lines.push(`${speaker}: ${m.content}`);
  }
  lines.push("Assistant:");
  return lines.join("\n");
}

// Lines the gemini CLI prints to stdout as preamble (not model output) — we
// strip these before returning the response.
const GEMINI_NOISE = /^Loaded cached credentials\.\s*$/;

// Gemini CLI responder — shells out to `gemini -p <prompt>`. Sends the full
// conversation history each call (stateless from gemini's perspective; our
// graph store is the source of truth).
export const geminiResponder: Responder = async (history) => {
  const prompt = formatTranscript(history);
  const out = await runCommand("gemini", ["-p", prompt]);
  return cleanGeminiOutput(out);
};

function cleanGeminiOutput(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => !GEMINI_NOISE.test(line))
    .join("\n")
    .trim();
}

function runCommand(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${cmd} exited ${code}: ${stderr.slice(0, 500)}`));
    });
  });
}

// Pick a default responder: gemini if the binary is on PATH, else stub.
export async function pickDefaultResponder(): Promise<{
  responder: Responder;
  name: string;
}> {
  try {
    await runCommand("which", ["gemini"]);
    return { responder: geminiResponder, name: "gemini" };
  } catch {
    return { responder: stubResponder, name: "stub" };
  }
}
