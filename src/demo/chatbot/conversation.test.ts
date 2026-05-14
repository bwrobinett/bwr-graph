import { describe, it, expect } from "vitest";
import { createChatbot, loadChatbot } from "./conversation";
import { stubResponder } from "./responder";

describe("createChatbot", () => {
  it("creates a Conversation node with empty messages", () => {
    const bot = createChatbot({ title: "Demo" });
    expect(bot.conversationId).toBe("conv-1");
    expect(bot.getHistory()).toEqual([]);
  });

  it("appends user + assistant turns in order", () => {
    const bot = createChatbot();
    bot.appendMessage("user", "Hi");
    bot.appendMessage("assistant", "Hello!");
    bot.appendMessage("user", "How are you?");

    const history = bot.getHistory();
    expect(history.map((m) => `${m.role}: ${m.content}`)).toEqual([
      "user: Hi",
      "assistant: Hello!",
      "user: How are you?",
    ]);
  });

  it("auto-generates sequential message IDs", () => {
    const bot = createChatbot();
    const m1 = bot.appendMessage("user", "first");
    const m2 = bot.appendMessage("assistant", "second");
    expect(m1.id).toBe("msg-1");
    expect(m2.id).toBe("msg-2");
  });

  it("respects an injected idGen for deterministic tests", () => {
    let n = 100;
    const bot = createChatbot({ idGen: () => `m${n++}` });
    expect(bot.appendMessage("user", "x").id).toBe("m100");
    expect(bot.appendMessage("assistant", "y").id).toBe("m101");
  });

  it("stores Message nodes with role + content + parent link", () => {
    const bot = createChatbot();
    bot.appendMessage("user", "Hi");
    const state = bot.store.getState();
    const msg = state.graph.nodes["msg-1"];
    expect(msg.type).toBe("Message");
    expect(msg.role).toBe("user");
    expect(msg.content).toBe("Hi");
    expect(msg.parent).toEqual(["conv-1"]);
  });
});

describe("Chatbot + stubResponder", () => {
  it("integrates: user turn → responder → assistant turn", async () => {
    const bot = createChatbot();
    bot.appendMessage("user", "ping");
    const reply = await stubResponder(bot.getHistory());
    bot.appendMessage("assistant", reply);

    const history = bot.getHistory();
    expect(history).toHaveLength(2);
    expect(history[1]).toMatchObject({ role: "assistant", content: "Got it: ping" });
  });
});

describe("toJsonLd round-trip", () => {
  it("exports a chatbot conversation as JSON-LD and re-imports it", async () => {
    const bot = createChatbot({ title: "Test chat" });
    bot.appendMessage("user", "Hi");
    bot.appendMessage("assistant", "Hello!");
    bot.appendMessage("user", "Bye");

    const doc = bot.toJsonLd();
    const resumed = await loadChatbot(doc);

    expect(resumed.conversationId).toBe("conv-1");
    const history = resumed.getHistory();
    expect(history.map((m) => m.content)).toEqual(["Hi", "Hello!", "Bye"]);
    expect(history.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  });

  it("resumed chatbot continues message IDs past the loaded set", async () => {
    const bot = createChatbot();
    bot.appendMessage("user", "first");
    bot.appendMessage("assistant", "second");

    const doc = bot.toJsonLd();
    const resumed = await loadChatbot(doc);
    const next = resumed.appendMessage("user", "third");

    expect(next.id).toBe("msg-3");
    expect(resumed.getHistory().map((m) => m.id)).toEqual([
      "msg-1",
      "msg-2",
      "msg-3",
    ]);
  });
});
