# demo/composed/ — cross-schema composition showcase

This is the punchline tab. It proves that schemas with **different vocabularies** — form's `children`, chatbot's `messages`, story's `scenes`/`characters`, graph-view's generic — all coexist in one flat node dictionary and **compose through links + a merged registry**, with zero special infrastructure for cross-schema rendering.

## What you see

One page, stacked panels:

1. **Conversation** (`conv-composed-1`) — a chatbot conversation seeded with a system Message whose `embed` link points at `form-1`. Visually framed inside the chat bubble: "embedded · form-1" + the full form rendered inline.
2. **Form** (`form-1`) — the same form from the Form tab.
3. **Story** (`story-1`) — the same story from the Story tab.
4. **GraphView** (`graph-view-1`) — the generic renderer.

Each panel is a real id in the `Composed` root's `panels` link list. The merged registry routes each panel to the right component purely on `node.type`.

## The cross-schema link

The chat panel contains a system `Message` (`msg-composed-embed`) with a real `embed` link to `form-1`:

```ts
{
  id: "msg-composed-embed",
  type: "Message",
  embed: ["form-1"],
}
```

- `embed` is declared as a link property in `chatbotContext` (`{ "@type": "@id" }`).
- `MessageView` reads it via `selectLinkedIds(s, nodeId, "embed")` and dispatches each id through `NodeRenderer`.
- The merged registry resolves `Form` → the form showcase's `Form` component.

Chatbot's `MessageView` doesn't know what a Form is. Form's `Form` component doesn't know it's being embedded. The only thing wiring them together is the merged registry — and that merge is a single `{ ...chatbotRegistry, ...formRegistry, ... }` spread.

## Files

- `composedSchema.ts` — Zod schema for the canonical `Composed` node plus the `composedContext` (one link list: `panels`).
- `composedExampleGraph.ts` — JSON-like plain `GraphDocument` used by the top-level demo seed.
- `components/ComposedView.tsx` — walks `panels` and dispatches each through `NodeRenderer`. Wraps each panel in a frame that shows the panel's node `type` as a badge, so the multi-schema composition is visually obvious.
- `components/registry.ts` — registers `Composed` → `ComposedView` only. The composition magic is in `src/demo/registry.ts`'s merge.

## Why this is the last wave

W1 split library from demo. W2 made the demo shell itself a graph. W3a proved one set of nodes can be rendered through a totally different registry. W4 puts it all together: different schemas, in one store, composing through real links, rendered through one merged registry. That's the architectural claim the project exists to make.
