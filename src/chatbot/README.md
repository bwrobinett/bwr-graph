# chatbot/

Vertical-slice demo: a CLI chatbot whose conversation is a graph. Linear shape, no React — chosen to test that the core store generalizes beyond browser/tree.

## What's in here

- `schema.ts` — `Conversation` and `Message` node types + the JSON-LD `@context` for them.
- `conversation.ts` — `createChatbot(...)` / `loadChatbot(...)`: wraps a Redux store with `appendUserTurn`, `appendAssistantTurn`, `getMessages`, `save`, `load`. All built on `addNode` + `insertLink`.
- `responder.ts` — `Responder` interface (`(history) => Promise<string>`) plus `stubResponder` and `localLlmResponder` (POSTs to `mlx_lm.server` on `localhost:8080`). New responders drop in here.
- `conversation.test.ts` — turn-append + JSON-LD round-trip tests.

## What this is not

A product. It's a feasibility demo: same store, same reducer actions, same JSON-LD pipeline as the form-builder, exercised against a different graph shape (linear) on a different surface (Node.js terminal).

The `bwr-chat` script in the vault wraps this in a tmux session for persistence across SSH reconnects.

## See also

- [BRAINSTORM](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/BRAINSTORM.md) — vertical-slice strategy and the named candidate slices
- [`../graph/README.md`](../graph/README.md) — the reducer actions used here
- [`../cli/README.md`](../cli/README.md) — the `npm run chat` entry point
