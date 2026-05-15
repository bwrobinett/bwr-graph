# form/

Form-builder showcase. The first vertical slice: a tree-shaped React UI driven entirely by a graph + the universal renderer.

## What's in here

- `schema.ts` — Zod schemas for canonical `Form` / `Section` / `Field` nodes plus `formContext` JSON-LD `@context`.
- `formExampleGraph.ts` — JSON-like plain `GraphDocument` for the top-level demo.
- `components/` — React components (`Form`, `Section`, `Field`) plus `registry.ts` mapping node types to components.
- `schema.test.ts` — proves the Zod node shapes, JSON-LD round-trip, and form/chatbot coexistence in one store.

## What this demonstrates

A form is a graph: `Form → Section → Field`, with `children` as an ordered link list. Editing dispatches the same five reducer actions as anything else. There's no special form library — the renderer + registry do all the work.

The internal node shape is canonical and ergonomic: every node has `id` and `type`. The context still matters for link semantics; here it marks `children` as an ordered link list.

## See also

- [`./schema.ts`](./schema.ts) — node types + context
- [`./components/README.md`](./components/README.md) — the React components
- [`../../renderer/README.md`](../../renderer/README.md) — the renderer that dispatches into this registry
