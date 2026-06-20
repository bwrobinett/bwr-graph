# graph/

The core: a flat node dictionary managed by Redux Toolkit, with JSON-LD-style `@context` deciding which properties are links.

## What's in here

- `types.ts` — `GraphNode`, `GraphState`, `GraphDocument`, `JsonLdContext`, `LinkLocation`, action payload types.
- `document.ts` — small helpers for building and composing portable graph documents.
- `slice.ts` — the Redux slice. Five scalar actions (`addNode`, `updateNode`, `removeNode`, `addLink`, `removeLink`), `setContext`, and bulk `mergeGraph` / `replaceGraph`. Exports `graphReducer`. `deleteNode` and `insertLink` remain as deprecated compatibility aliases.
- `context.ts` — `isLinkProperty` / `isOrderedProperty` — the only place the `@context` is interpreted.
- `selectors.ts` — `selectNode`, `selectLinkedNodes`, `selectLinkedIds`, `makeSelectNodesByType`, `selectSubtreeIds`.
- `slice.test.ts` — reducer tests.

## Conventions

- Every node has `id` and `type`; everything else is open.
- Link properties are always arrays (even singletons). The `@context` is the *only* signal that a property is a link — array shape alone isn't.
- The reducer doesn't garbage-collect dangling references. Selectors filter them on read.

## See also

- [EPIC - Graph store](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/EPIC%20-%20Graph%20store.md) — the architectural spec this implements
- [`../renderer/README.md`](../renderer/README.md) — universal renderer that consumes this store
- [`../jsonld/README.md`](../jsonld/README.md) — import/export boundary that round-trips graph state
