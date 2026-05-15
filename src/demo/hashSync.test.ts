import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import {
  graphReducer,
  addNode,
  setContext,
  updateNode,
} from "../graph/slice";
import { demoShellContext } from "./demo/schema";
import { syncHashWithStore } from "./hashSync";

function makeStore(activeDemo = "form") {
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(setContext({ context: demoShellContext }));
  store.dispatch(
    addNode({
      id: "app-1",
      type: "DemoApp",
      title: "test",
      tabs: [],
      activeDemo,
    }),
  );
  return store;
}

describe("syncHashWithStore", () => {
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    window.history.replaceState(null, "", window.location.pathname);
  });

  afterEach(() => {
    if (cleanup) cleanup();
    cleanup = null;
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("seed default reflects into the URL hash on boot", () => {
    const store = makeStore("form");
    cleanup = syncHashWithStore(store, "app-1");
    expect(window.location.hash).toBe("#form");
  });

  it("URL hash wins on boot when it differs from the seeded value", () => {
    window.history.replaceState(null, "", "#chat");
    const store = makeStore("form");
    cleanup = syncHashWithStore(store, "app-1");
    expect(store.getState().graph.nodes["app-1"].activeDemo).toBe("chat");
  });

  it("dispatches from the store push the URL hash", () => {
    const store = makeStore("form");
    cleanup = syncHashWithStore(store, "app-1");
    store.dispatch(updateNode({ id: "app-1", activeDemo: "chat" }));
    expect(window.location.hash).toBe("#chat");
  });

  it("hashchange events push into the store", () => {
    const store = makeStore("form");
    cleanup = syncHashWithStore(store, "app-1");

    window.history.replaceState(null, "", "#chat");
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(store.getState().graph.nodes["app-1"].activeDemo).toBe("chat");
  });

  it("cleanup detaches the listener and the subscription", () => {
    const store = makeStore("form");
    cleanup = syncHashWithStore(store, "app-1");
    cleanup();
    cleanup = null;

    // After cleanup, hash changes should NOT push into the store.
    window.history.replaceState(null, "", "#chat");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    expect(store.getState().graph.nodes["app-1"].activeDemo).toBe("form");

    // And store dispatches should NOT push the hash either.
    store.dispatch(updateNode({ id: "app-1", activeDemo: "story" }));
    expect(window.location.hash).toBe("#chat");
  });
});
