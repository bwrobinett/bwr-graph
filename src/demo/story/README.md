# story/

Vertical-slice demo: a story is a DAG, not a tree. `Story → Scene[]`, but each `Scene` references one or more `Character` nodes, and characters are shared across scenes — so the same node appears in multiple parents' link lists.

## What's in here

- `schema.ts` — Zod schemas for canonical `Story` / `Scene` / `Character` nodes plus JSON-LD `@context` (with `characters` declared as a link list).
- `story.ts` — `createStory(...)` / `loadStory(...)`: helpers for adding scenes, attaching characters, saving / loading via JSON-LD. Each call gets its own private Redux store.
- `cli.ts` — `npm run story` entry point. Loads / saves / inspects story JSON-LD docs.
- `story.test.ts` — DAG-shape tests (shared-character refs survive round-trip).
- `storyExampleGraph.ts` — JSON-like plain `GraphDocument` with the sample story (same content as the CLI demo) for the top-level demo seed to compose.
- `components/` — `StoryView`, `SceneView`, `CharacterView` and their registry. Each component reads its node via selectors and dispatches links via `NodeRenderer`. Character chips reuse the same node id wherever a scene's cast references it (the DAG payoff).

## What this proves

Multi-reference graphs work without special-case code. The `removeLink` / `insertLink` actions don't care whether a node is referenced from one place or many — selectors filter dangling ids on read, so deleting a scene that still references a character doesn't corrupt the character.

## See also

- [BRAINSTORM](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/BRAINSTORM.md) — story-writing as a named vertical slice
- [`../../graph/README.md`](../../graph/README.md) — reducer + selector semantics this relies on
- [`../../jsonld/README.md`](../../jsonld/README.md) — import/export pipeline used by `/save` and `/load`
