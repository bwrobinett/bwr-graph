# bwr-graph

A universal graph store: Redux reducers + JSON-LD + a flat node dictionary, paired with a universal React renderer.

## What this is

State is one flat map of nodes — every reference is an id pointing at another entry, never a nested object. Five reducer actions (`addNode`, `updateNode`, `deleteNode`, `insertLink`, `removeLink`) plus `setContext` cover the whole surface. JSON-LD lives at the I/O boundary: `importJsonLd` flattens nested docs into the dictionary; `exportJsonLd` produces a portable doc back out. A `NodeRenderer` turns any node into a React component via a type-keyed registry.

The architectural claim: the same foundation works for any graph shape and any UI surface. So far that's been exercised by:

- a tree-shaped React form builder (`src/components/`)
- a linear command-line chatbot (`src/chatbot/`, no React)
- a multi-reference DAG story-writer (`src/story/`)

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

`src/` folders, each with its own README:

- [`graph/`](src/graph/README.md) — **core**: slice, selectors, types, JSON-LD context helpers
- [`renderer/`](src/renderer/README.md) — **core**: `NodeRenderer`, `RegistryContext`, `RegistryOverride`, `GenericNode` fallback
- [`jsonld/`](src/jsonld/README.md) — boundary: import (flatten) and export
- [`components/`](src/components/README.md) — form-builder demo components
- [`chatbot/`](src/chatbot/README.md) — vertical slice: chat as a graph
- [`story/`](src/story/README.md) — vertical slice: story DAG with shared character refs
- [`cli/`](src/cli/README.md) — CLI runners for the chatbot and story demos
- [`test/`](src/test/README.md) — vitest setup

`App.tsx`, `main.tsx`, `store.ts`, `seed.ts` at the top of `src/` are the React app entry + demo seed.

## Project skill

The higher-level vision lives in the vault monorepo:

- [SKILL](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/SKILL.md) — project home and trigger description
- [EPIC - Graph store](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/EPIC%20-%20Graph%20store.md) — full architectural spec (state shape, actions, JSON-LD, dereferenceable IDs, applications, open questions)
- [BRAINSTORM](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/BRAINSTORM.md) — vertical-slice strategy and open design questions

The EPIC is the source of truth for the architecture; this repo is the implementation.
