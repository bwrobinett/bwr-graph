# form/

Form-builder showcase. The first vertical slice: a tree-shaped React UI driven entirely by a graph + the universal renderer.

## What's in here

- `schema.ts` — `Form` / `Section` / `Field` node-type constants, `formContext` JSON-LD `@context`, and view-model interfaces. Mirrors `chatbot/schema.ts` and `story/schema.ts`.
- `components/` — React components (`Form`, `Section`, `Field`) plus `registry.ts` mapping node types to components.
- `schema.test.ts` — proves the `componentKey` ↔ `@id` round-trip and form/chatbot coexistence in one store.

## What this demonstrates

A form is a graph: `Form → Section → Field`, with `children` as an ordered link list. Editing dispatches the same five reducer actions as anything else. There's no special form library — the renderer + registry do all the work.

Form's `@context` aliases `@id` → `componentKey`, so the form's external JSON-LD vocabulary uses `componentKey` as the node identifier. Other showcases (chatbot, story, demo shell) keep `@id`/`id`; all coexist in one flat node dictionary. The alias is the proof that schemas can diverge on identity-property names without breaking the library.

**Alias declaration form (important):** keyword aliases must use the unambiguous object form `{ componentKey: { "@id": "@id" } }`. The string-form shorthand `"componentKey": "@id"` is reserved in this codebase to mean "this property is a link" (see `graph/context.ts`/`isLinkProperty`). Mixing the two collides.

## See also

- [`./schema.ts`](./schema.ts) — node types + context
- [`./components/README.md`](./components/README.md) — the React components
- [`../../renderer/README.md`](../../renderer/README.md) — the renderer that dispatches into this registry
