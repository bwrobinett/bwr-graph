import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { RegistryContext } from "./renderer/RegistryContext";
import { NodeRenderer } from "./renderer/NodeRenderer";
import { formRegistry } from "./components/registry";
import { chatbotRegistry } from "./chatbot/components/registry";
import {
  ChatbotConfigContext,
  type ChatbotConfig,
  DEFAULT_CHATBOT_CONFIG,
} from "./chatbot/components/ChatbotConfigContext";
import { pickDefaultResponder } from "./chatbot/responder";

type Tab = "form" | "chat";

function initialTab(): Tab {
  if (typeof window === "undefined") return "form";
  // Hash-based "routing" — no router lib, but `/chat` style links via #chat.
  return window.location.hash === "#chat" ? "chat" : "form";
}

export function App() {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [chatConfig, setChatConfig] = useState<ChatbotConfig>(DEFAULT_CHATBOT_CONFIG);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHash = () => setTab(window.location.hash === "#chat" ? "chat" : "form");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Probe for the local-llm server once on mount. If it's up + reachable from
  // the browser, switch the responder; otherwise stay on the stub so the demo
  // never hard-fails. (CORS-blocked fetches reject, which counts as "down".)
  useEffect(() => {
    let cancelled = false;
    void pickDefaultResponder().then((picked) => {
      if (cancelled) return;
      setChatConfig({ responder: picked.responder, responderName: picked.name });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const goTab = (next: Tab) => {
    setTab(next);
    if (typeof window !== "undefined") {
      window.location.hash = next === "chat" ? "#chat" : "";
    }
  };

  return (
    <Provider store={store}>
      <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <header style={{ marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>bwr-graph demo</h1>
          <nav style={navStyle}>
            <button
              type="button"
              onClick={() => goTab("form")}
              style={tabStyle(tab === "form")}
              data-testid="tab-form"
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => goTab("chat")}
              style={tabStyle(tab === "chat")}
              data-testid="tab-chat"
            >
              Chat
            </button>
          </nav>
        </header>

        {tab === "form" ? (
          <>
            <p style={hintStyle}>
              A small form rendered from a flat graph. Edit a field — only that
              node's component re-renders.
            </p>
            <RegistryContext.Provider value={formRegistry}>
              <NodeRenderer nodeId="form-1" />
            </RegistryContext.Provider>
          </>
        ) : (
          <>
            <p style={hintStyle}>
              Each message is a graph node; the conversation is a subgraph. The
              same <code>NodeRenderer</code> + registry that drives the form
              renders the chat too.
            </p>
            <ChatbotConfigContext.Provider value={chatConfig}>
              <RegistryContext.Provider value={chatbotRegistry}>
                <NodeRenderer nodeId="conv-1" />
              </RegistryContext.Provider>
            </ChatbotConfigContext.Provider>
          </>
        )}
      </main>
    </Provider>
  );
}

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 8,
};

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    border: "1px solid #ccc",
    borderRadius: 6,
    background: active ? "#2f6fed" : "white",
    color: active ? "white" : "#333",
    fontSize: 13,
    cursor: "pointer",
  };
}

const hintStyle: React.CSSProperties = {
  color: "#666",
  fontSize: 14,
};
