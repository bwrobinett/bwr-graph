# demo/

Everything that isn't the library lives here. The library — `graph/`, `renderer/`, `jsonld/` — knows nothing about any specific schema or UI. This folder is where schemas + components + entry points live.

## What's in here

- `main.tsx` — Vite entry; `index.html` points to `/src/demo/main.tsx`. Mounts `<App />`.
- `App.tsx` — demo shell. Hash-routed tabs (`#chat` → chat, default → form).
- `store.ts` — Redux store wired with `graphReducer`.
- `seed.ts` — composes per-showcase seeds (form via JSON-LD import, then a chatbot Conversation).
- `form/`, `chatbot/`, `story/` — three showcases. Each owns its `schema.ts` (node types + JSON-LD `@context`), runtime code, and (where relevant) `components/` + `cli.ts`.

## Convention

Each showcase is self-contained: schema in `schema.ts`, runtime/factory functions alongside, React components under `components/`, CLI entry under `cli.ts`. No showcase reaches into another's internals.

## See also

- [IDEA - Demo folder restructure](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/In%20Progress/IDEA%20-%20Demo%20folder%20restructure.md) — the spec this layout implements
- [IDEA - Library-vs-demo split + graph-rendered demo shell](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/Ready/IDEA%20-%20Library-vs-demo%20split%20+%20graph-rendered%20demo%20shell.md) — parent IDEA (phase 2 deferred)
- [`../graph/README.md`](../graph/README.md), [`../renderer/README.md`](../renderer/README.md), [`../jsonld/README.md`](../jsonld/README.md) — the library these showcases consume
