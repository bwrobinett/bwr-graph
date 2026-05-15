# jsonld/

Boundary layer between RDF-style JSON-LD documents and the flat node dictionary. Used at I/O — never inside reducers or selectors.

## What's in here

- `import.ts` — `importJsonLd(doc)`: runs `jsonld.flatten` on the input, walks each result to extract `@id` / `@type`, classifies properties via the `@context`, and returns `{ context, nodes }`. `importJsonLdDocument(doc)` wraps that result as a portable `GraphDocument` ready for `mergeGraph`.
- `export.ts` — `exportJsonLd(state)`: turns the in-memory graph back into a JSON-LD document. Used by `/save` in the chatbot/story demos.
- `import.test.ts`, `export.test.ts` — round-trip tests.

## Why it lives here

JSON-LD is the portability story. The graph store doesn't depend on it — `@context` is just a configuration map. But import/export is where the shape question gets settled: nested doc → flat dictionary on the way in, flat dictionary → nested doc on the way out.

## See also

- [EPIC - Graph store](https://github.com/bwrobinett/bwr-monorepo/blob/main/_kim/Skills/proj-bwr-graph/EPIC%20-%20Graph%20store.md) — the import/export pipeline section
- [`../graph/README.md`](../graph/README.md) — the dictionary shape these functions translate to/from
