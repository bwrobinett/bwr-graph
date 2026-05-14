# test/

Vitest setup utilities.

## What's in here

- `setup.ts` — `@testing-library/jest-dom` import. Pulled in via `vitest.config` so DOM matchers (`toBeInTheDocument`, etc.) are available in every test.

## See also

- [`../graph/README.md`](../graph/README.md), [`../renderer/README.md`](../renderer/README.md), [`../jsonld/README.md`](../jsonld/README.md), [`../demo/chatbot/README.md`](../demo/chatbot/README.md), [`../demo/story/README.md`](../demo/story/README.md) — each carries its own `*.test.ts` files
