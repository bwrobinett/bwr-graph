import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { RegistryContext } from "../renderer/RegistryContext";
import { NodeRenderer } from "../renderer/NodeRenderer";
import { mergedDemoRegistry } from "./registry";
import {
  ChatbotConfigContext,
  type ChatbotConfig,
  DEFAULT_CHATBOT_CONFIG,
} from "./chatbot/components/ChatbotConfigContext";
import { pickDefaultResponder } from "./chatbot/responder";

/**
 * Demo entry. Everything user-visible (the nav, the active showcase, the
 * empty-state hints) is rendered out of the graph by `NodeRenderer` against
 * the merged registry — there is no hand-rolled tab UI here.
 *
 * What this component still owns:
 *   - Wrapping providers (Redux, RegistryContext, ChatbotConfigContext).
 *   - Probing for the local-llm server once at boot and swapping in the real
 *     responder when it's reachable. This is cross-cutting plumbing for the
 *     chatbot showcase; it stays mounted across tab switches so the responder
 *     is ready the moment the chat tab activates.
 *
 * Hash routing lives in `./hashSync.ts` and is wired in `./main.tsx` — no
 * `useState` / `useEffect` for nav state.
 */
export function App() {
  const [chatConfig, setChatConfig] = useState<ChatbotConfig>(DEFAULT_CHATBOT_CONFIG);

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

  return (
    <Provider store={store}>
      <ChatbotConfigContext.Provider value={chatConfig}>
        <RegistryContext.Provider value={mergedDemoRegistry}>
          <NodeRenderer nodeId="app-1" />
        </RegistryContext.Provider>
      </ChatbotConfigContext.Provider>
    </Provider>
  );
}
