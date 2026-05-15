# demo/graph-view/ — generic-render showcase

This showcase renders **every node in the store** generically, regardless of its native type. It exists to make one architectural point visible: the registry decides what a node looks like, the node itself is just data. A chatbot `Message` is a chat bubble in the chat tab; the same `Message` node is a generic key/value card here.

## Files

- `schema.ts` — `GraphView` root node type plus the `graphViewContext` (no link properties of its own).
- `components/GraphView.tsx` — reads `state.graph.nodes`, sorts by type then id, and renders each via `NodeCard`. Wraps the subtree in a `RegistryOverride` so any nested `<NodeRenderer />` calls also resolve to `NodeCard`.
- `components/NodeCard.tsx` — generic display: type badge, id, properties as key/value rows. Uses `isLinkProperty(state.graph.context, prop)` to decide which arrays are link arrays (rendered as expandable nested cards) vs literal arrays (rendered as JSON).
- `components/registry.ts` — registers `GraphView` only. The "every type renders as NodeCard" behavior is a `RegistryOverride` inside `GraphView`, scoped to the subtree.
- `seed.ts` — `graphViewDocument()` returns the `graph-view-1` root as a portable graph document.

## Why

The other showcases prove the registry pattern works for typed views (forms, chats, stories). This one proves the *inverse*: the same nodes, dispatched through a different registry, show up completely differently. It also functions as a debug/inspector view for the demo — every node, with its full property set, in one place.
