import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createChatbot, loadChatbot, type Chatbot } from "./conversation";
import { pickDefaultResponder, stubResponder, localLlmResponder, type Responder } from "./responder";

const HELP = `
Commands:
  /help            Show this help
  /history         Print the full conversation history
  /save <path>     Save conversation as JSON-LD to <path>
  /load <path>     Load a conversation from a JSON-LD file (replaces current)
  /responder local-llm|stub   Switch responder mid-session
  /quit            Exit
Anything else is sent as a user message.
`.trim();

interface CliState {
  bot: Chatbot;
  responder: Responder;
  responderName: string;
}

async function main(): Promise<void> {
  let bot = createChatbot();
  const picked = await pickDefaultResponder();
  const state: CliState = {
    bot,
    responder: picked.responder,
    responderName: picked.name,
  };

  const rl = createInterface({ input: stdin, output: stdout });

  console.log(`bwr-graph chatbot — conversation: ${bot.conversationId}`);
  console.log(`responder: ${state.responderName} (type /help for commands)`);
  console.log();

  while (true) {
    const line = (await rl.question("> ")).trim();
    if (!line) continue;

    if (line.startsWith("/")) {
      const done = await handleCommand(line, state);
      if (done) break;
      continue;
    }

    state.bot.appendMessage("user", line);

    const stopSpinner = startSpinner(state.responderName);
    try {
      const reply = await state.responder(state.bot.getHistory());
      stopSpinner();
      state.bot.appendMessage("assistant", reply);
      console.log(`[assistant] ${reply}\n`);
    } catch (err) {
      stopSpinner();
      console.error(`[error] responder failed: ${(err as Error).message}\n`);
    }
  }

  rl.close();
}

// Returns true if the loop should exit.
async function handleCommand(line: string, state: CliState): Promise<boolean> {
  const [cmd, ...rest] = line.slice(1).split(/\s+/);
  const arg = rest.join(" ");

  switch (cmd) {
    case "help":
      console.log(HELP + "\n");
      return false;

    case "history": {
      const history = state.bot.getHistory();
      if (history.length === 0) {
        console.log("(no messages)\n");
      } else {
        history.forEach((m, i) => {
          console.log(`${i + 1}. ${m.role}: ${m.content}`);
        });
        console.log();
      }
      return false;
    }

    case "save": {
      if (!arg) {
        console.log("usage: /save <path>\n");
        return false;
      }
      const doc = state.bot.toJsonLd();
      const path = resolve(arg);
      await writeFile(path, JSON.stringify(doc, null, 2), "utf8");
      console.log(`saved to ${path}\n`);
      return false;
    }

    case "load": {
      if (!arg) {
        console.log("usage: /load <path>\n");
        return false;
      }
      const path = resolve(arg);
      const raw = await readFile(path, "utf8");
      const doc = JSON.parse(raw);
      state.bot = await loadChatbot(doc);
      console.log(`loaded ${path} (${state.bot.getHistory().length} messages)\n`);
      return false;
    }

    case "responder": {
      if (arg === "local-llm") {
        state.responder = localLlmResponder;
        state.responderName = "local-llm";
      } else if (arg === "stub") {
        state.responder = stubResponder;
        state.responderName = "stub";
      } else {
        console.log("usage: /responder local-llm|stub\n");
        return false;
      }
      console.log(`responder: ${state.responderName}\n`);
      return false;
    }

    case "quit":
    case "exit":
      console.log("bye.");
      return true;

    default:
      console.log(`unknown command: /${cmd} (try /help)\n`);
      return false;
  }
}

function startSpinner(label: string): () => void {
  if (!stdout.isTTY) return () => {};
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const start = Date.now();
  let i = 0;
  const render = () => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    stdout.write(`\r\x1b[2K${frames[i % frames.length]} ${label} thinking… ${elapsed}s`);
    i++;
  };
  render();
  const id = setInterval(render, 100);
  return () => {
    clearInterval(id);
    stdout.write("\r\x1b[2K");
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
