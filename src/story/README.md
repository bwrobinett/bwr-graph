# story/

Vertical-slice demo: a story is a DAG, not a tree. `Story → Scene[]`, but each `Scene` references one or more `Character` nodes, and characters are shared across scenes — so the same node appears in multiple parents' link lists.

## What's in here

- `schema.ts` — `Story` / `Scene` / `Character` node types + JSON-LD `@context` (with `characters` declared as a link list).
- `story.ts` — `createStory(...)` / `loadStory(...)`: helpers for adding scenes, attaching characters, saving / loading via JSON-LD.
- `story.test.ts` — DAG-shape tests (shared-character refs survive round-trip).

## What this proves

Multi-reference graphs work without special-case code. The `removeLink` / `insertLink` actions don't care whether a node is referenced from one place or many — selectors filter dangling ids on read, so deleting a scene that still references a character doesn't corrupt the character.

## See also

- [BRAINSTORM](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/BRAINSTORM.md) — story-writing as a named vertical slice
- [`../graph/README.md`](../graph/README.md) — reducer + selector semantics this relies on
- [`../cli/README.md`](../cli/README.md) — the `npm run story` entry point
