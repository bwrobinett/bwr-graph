# renderer/

The universal renderer: turns any graph node into a React component via a type-keyed registry. Knows nothing about the application — Form, Section, Field, Conversation, Message all flow through the same component.

## What's in here

- `NodeRenderer.tsx` — `<NodeRenderer nodeId="..." />`. Looks up the node, picks the registry entry for its `type`, falls back to `GenericNode`. Also exports `RegistryOverride` for nested registry merging.
- `RegistryContext.ts` — the `Registry` type (map from node type to component) and the React context that provides the active registry.
- `GenericNode.tsx` — fallback renderer for unknown types and missing nodes; shows the raw shape so unimplemented types stay visible during a build.
- `NodeRenderer.test.tsx` — renderer tests.

## How it's used

```tsx
<RegistryContext.Provider value={formRegistry}>
  <NodeRenderer nodeId="form-1" />
</RegistryContext.Provider>
```

Children call `<NodeRenderer nodeId={childId} />` recursively, pulling their own data via selectors. There's no prop-drilling — every component selects what it needs from the same store.

## See also

- [EPIC - Graph store](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/EPIC%20-%20Graph%20store.md) — universal-renderer rationale
- [`../graph/README.md`](../graph/README.md) — the store this renders from
- [`../demo/form/components/README.md`](../demo/form/components/README.md) — form-builder registry, the canonical example
