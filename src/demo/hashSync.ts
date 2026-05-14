import { updateNode } from "../graph/slice";
import { selectNode, type RootState } from "../graph/selectors";
import type { store as appStore } from "./store";

type Store = typeof appStore;

/**
 * Wire `location.hash` ↔ `state.graph.nodes[appId].activeDemo`.
 *
 * Boot:
 *   1. Snapshot whatever's in the URL hash (or fall back to the seeded value).
 *   2. Push it into the store so the rest of the app reads from one place.
 *
 * Steady state:
 *   - Store changes (e.g. a tab click dispatches `updateNode`) → reflected
 *     into the URL hash.
 *   - Hash changes (back/forward, manual edit, deep link) → dispatched into
 *     the store.
 *
 * Returns a cleanup function that drops the subscriptions.
 */
export function syncHashWithStore(
  store: Store,
  appId: string,
): () => void {
  if (typeof window === "undefined") return () => {};

  const readHash = () => window.location.hash.replace(/^#/, "");
  const readActive = () => {
    const node = selectNode(store.getState() as RootState, appId);
    return typeof node?.activeDemo === "string" ? node.activeDemo : "";
  };

  // Boot — let the URL win if it names something other than the seed default.
  const initialHash = readHash();
  const initialActive = readActive();
  if (initialHash && initialHash !== initialActive) {
    store.dispatch(updateNode({ id: appId, activeDemo: initialHash }));
  } else if (!initialHash && initialActive) {
    // Seed default — reflect it into the URL so deep-linking works without an
    // initial click.
    setHash(initialActive);
  }

  // Store → hash
  let lastActive = readActive();
  const unsubscribe = store.subscribe(() => {
    const current = readActive();
    if (current === lastActive) return;
    lastActive = current;
    setHash(current);
  });

  // Hash → store
  const onHashChange = () => {
    const current = readHash();
    if (current === readActive()) return;
    store.dispatch(updateNode({ id: appId, activeDemo: current }));
  };
  window.addEventListener("hashchange", onHashChange);

  return () => {
    unsubscribe();
    window.removeEventListener("hashchange", onHashChange);
  };
}

function setHash(key: string): void {
  // Replace state instead of pushing — tab switches shouldn't bloat browser
  // history. Leading `#` is required so an empty key clears the hash cleanly.
  const next = key ? `#${key}` : "";
  if (window.location.hash === next) return;
  // Use replaceState to avoid generating extra history entries.
  const url = `${window.location.pathname}${window.location.search}${next}`;
  window.history.replaceState(null, "", url);
}
