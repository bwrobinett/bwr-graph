# cli/

Entry points for the two non-React vertical-slice demos. Run via `vite-node`.

## What's in here

- `chatbot.ts` — `npm run chat`. Interactive REPL over `chatbot/conversation.ts`. Slash commands: `/help`, `/history`, `/save`, `/load`, `/responder stub|gemini`, `/quit`.
- `story.ts` — `npm run story`. Demo loader for `story/story.ts`; prints scenes + characters and saves / loads JSON-LD.

## Status

Demo runners only. No tests — these are thin wrappers over `chatbot/` and `story/`, which carry the test coverage.

## See also

- [`../chatbot/README.md`](../chatbot/README.md) — chatbot conversation logic
- [`../story/README.md`](../story/README.md) — story DAG logic
- [BRAINSTORM](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/BRAINSTORM.md) — vertical-slice rationale
