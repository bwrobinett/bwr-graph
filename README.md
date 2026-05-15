# bwr-graph

A universal graph store: Redux reducers + JSON-LD + a flat node dictionary, paired with a universal React renderer.

## What this is

State is one flat map of nodes — every reference is an id pointing at another entry, never a nested object. Five scalar reducer actions (`addNode`, `updateNode`, `deleteNode`, `insertLink`, `removeLink`) plus `setContext` cover local edits; `mergeGraph` / `replaceGraph` load portable `GraphDocument` payloads in bulk. JSON-LD lives at the I/O boundary: `importJsonLd` flattens nested docs into the dictionary; `exportJsonLd` produces a portable doc back out. A `NodeRenderer` turns any node into a React component via a type-keyed registry.

The architectural claim: the same foundation works for any graph shape and any UI surface. So far that's been exercised by:

- a tree-shaped React form builder (`src/demo/form/`)
- a linear chatbot (`src/demo/chatbot/`, browser surface + CLI)
- a multi-reference DAG story-writer (`src/demo/story/`, CLI)

All three round-trip through the same reducer + JSON-LD pipeline.

## Run it

```
npm install
npm run dev          # form-builder demo (Vite + React)
npm run chat         # gemini CLI chatbot
npm run story demo   # story-writer demo (loads a sample DAG)
npm test             # vitest
npm run typecheck
npm run build
```

## Layout

The library lives at the top of `src/`. Everything else is under `src/demo/`. Each folder has its own README.

**Library** (no schema, no UI assumptions):

- [`src/graph/`](src/graph/README.md) — slice, selectors, types, JSON-LD context helpers
- [`src/renderer/`](src/renderer/README.md) — `NodeRenderer`, `RegistryContext`, `RegistryOverride`, `GenericNode` fallback
- [`src/jsonld/`](src/jsonld/README.md) — import (flatten) and export
- [`src/test/`](src/test/README.md) — vitest setup (shared)

**Demo** ([`src/demo/`](src/demo/README.md)):

- `App.tsx`, `main.tsx`, `store.ts`, `seed.ts` — Vite entry + demo shell + Redux store + composed example graph boot
- [`form/`](src/demo/form/README.md) — form-builder showcase (React)
- [`chatbot/`](src/demo/chatbot/README.md) — chatbot showcase (browser + CLI)
- [`story/`](src/demo/story/README.md) — story DAG showcase (CLI)

## Project skill

The higher-level vision lives in the vault monorepo:

- [SKILL](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/SKILL.md) — project home and trigger description
- [EPIC - Graph store](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/EPIC%20-%20Graph%20store.md) — full architectural spec (state shape, actions, JSON-LD, dereferenceable IDs, applications, open questions)
- [BRAINSTORM](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/BRAINSTORM.md) — vertical-slice strategy and open design questions

The EPIC is the source of truth for the architecture; this repo is the implementation.
