# demo/

Everything that isn't the library lives here. The library — `graph/`, `renderer/`, `jsonld/` — knows nothing about any specific schema or UI. This folder is where schemas + components + entry points live.

## What's in here

- `main.tsx` — Vite entry; `index.html` points to `/src/demo/main.tsx`. Seeds the graph, wires hash sync, mounts `<App />`.
- `App.tsx` — providers + a single `<NodeRenderer nodeId="app-1" />`. The whole user-visible UI is graph-rendered from there.
- `store.ts` — Redux store wired with `graphReducer`.
- `seed.ts` — composes per-showcase plain example graph objects and dispatches one `mergeGraph(...)`.
- `registry.ts` — merged registry of every showcase plus the meta-shell. The single `RegistryContext.Provider` value at the top of the tree.
- `hashSync.ts` — store subscriber that mirrors `state.graph.nodes["app-1"].activeDemo` ↔ `location.hash`. No React lifecycle for nav.
- `form/`, `chatbot/`, `story/` — three domain showcases. Each owns its `schema.ts` (Zod node schemas + JSON-LD `@context`), runtime code, and (where relevant) `components/` + `cli.ts`.
- `demo/` — the meta-showcase: the demo shell rendered as a graph. `DemoApp` and `DemoTab` are node types; clicks dispatch `updateNode`.

## Convention

Each showcase is self-contained: schema in `schema.ts`, JSON-like example graph data alongside, runtime/factory functions where needed, React components under `components/`, CLI entry under `cli.ts`. No showcase reaches into another's internals.

## See also

- [IDEA - Demo folder restructure](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/In%20Progress/IDEA%20-%20Demo%20folder%20restructure.md) — the spec this layout implements
- [IDEA - Library-vs-demo split + graph-rendered demo shell](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/Ready/IDEA%20-%20Library-vs-demo%20split%20+%20graph-rendered%20demo%20shell.md) — parent IDEA (phase 2 deferred)
- [`../graph/README.md`](../graph/README.md), [`../renderer/README.md`](../renderer/README.md), [`../jsonld/README.md`](../jsonld/README.md) — the library these showcases consume
