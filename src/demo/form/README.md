# form/

Form-builder showcase. The first vertical slice: a tree-shaped React UI driven entirely by a graph + the universal renderer.

## What's in here

- `schema.ts` — `Form` / `Section` / `Field` node-type constants, `formContext` JSON-LD `@context`, and view-model interfaces. Mirrors `chatbot/schema.ts` and `story/schema.ts`.
- `components/` — React components (`Form`, `Section`, `Field`) plus `registry.ts` mapping node types to components.

## What this demonstrates

A form is a graph: `Form → Section → Field`, with `children` as an ordered link list. Editing dispatches the same five reducer actions as anything else. There's no special form library — the renderer + registry do all the work.

## See also

- [`./schema.ts`](./schema.ts) — node types + context
- [`./components/README.md`](./components/README.md) — the React components
- [`../../renderer/README.md`](../../renderer/README.md) — the renderer that dispatches into this registry
