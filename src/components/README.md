# components/

Form-builder demo components. The first vertical slice — proves the store + renderer handle a tree-shaped React UI.

## What's in here

- `Form.tsx` — top-level form node; renders its `children` link list.
- `Section.tsx` — a labeled group; renders its own `children` link list.
- `Field.tsx` — leaf input; reads `label` / `placeholder` / `value` from its node.
- `registry.ts` — exports `formRegistry: Registry` mapping `Form` / `Section` / `Field` types to the components above.

## What this demonstrates

A form is a graph: `Form → Section → Field`, with `children` as an ordered link list. Editing dispatches the same five reducer actions as anything else. There's no special form library — the renderer + registry do all the work.

## See also

- [EPIC - Graph store](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/EPIC%20-%20Graph%20store.md) — form builder is one of the named application areas
- [`../renderer/README.md`](../renderer/README.md) — `NodeRenderer` and the registry mechanism
- [`../graph/README.md`](../graph/README.md) — the store these components select from
