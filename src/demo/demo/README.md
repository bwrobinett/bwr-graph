# demo/demo/ — meta-showcase

This is the demo of the demo. The shell that hosts the form and chat tabs is itself a graph: the nav lives in the store as nodes, the active tab is a property on the `DemoApp` node, and `App.tsx` reduces to a single `<NodeRenderer nodeId="app-1" />` under a merged registry.

## Files

- `schema.ts` — `DemoApp` and `DemoTab` node types, plus the `demoShellContext` JSON-LD context that declares `tabs`, `target`, and `app` as link properties.
- `components/DemoAppView.tsx` — renders the title, walks `tabs` via `NodeRenderer`, and dispatches the active tab's `target` into another `NodeRenderer` for the showcase subtree.
- `components/DemoTabView.tsx` — clickable nav button. Reads `app` back-ref off the tab so it can `dispatch(updateNode({ id: appId, activeDemo: tab.key }))` without compile-time knowledge of the app id.
- `components/registry.ts` — registers `DemoApp` and `DemoTab`. Composed into the merged registry at `../registry.ts`.
- `seed.ts` — `seedDemoShell(tabs, initialKey)`: creates `app-1` plus one `DemoTab` per entry. The list of showcases lives one level up in `../seed.ts`.

## Why

The other showcases (`form/`, `chatbot/`, `story/`) demonstrate that domain types render via the registry. This one demonstrates that the demo *itself* is no different: the demo container is just another graph, just another set of types, just another set of components dispatched via the same `NodeRenderer`. There is no special demo plumbing — no `useState` for the active tab, no hand-rolled nav.

Hash routing is not in this folder — it's a store subscriber at `../hashSync.ts`, wired in `../main.tsx`. The components don't know the URL exists; they read and write `activeDemo` and the subscriber mirrors it both ways.
