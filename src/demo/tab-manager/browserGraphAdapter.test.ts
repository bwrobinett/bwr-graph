import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, mergeGraph } from "../../graph/slice";
import { selectLinkedIds } from "../../graph/selectors";
import {
  attachWindowToApp,
  browserSnapshotToGraph,
  reconcileBrowserSnapshot,
} from "./browserGraphAdapter";
import { tabManagerExampleGraph } from "./tabManagerExampleGraph";

describe("browser graph adapter", () => {
  it("converts browser snapshots into abstract browser graph nodes", () => {
    const doc = browserSnapshotToGraph({
      adapterId: "adapter-chrome",
      adapterLabel: "Chrome",
      adapterKind: "chrome",
      windows: [
        {
          id: "7",
          label: "Work window",
          focused: true,
          tabs: [
            {
              id: "900",
              title: "Example",
              url: "https://example.com",
              active: true,
              pinned: false,
            },
          ],
        },
      ],
    });

    expect(doc.nodes["adapter-chrome"]).toMatchObject({
      type: "BrowserAdapter",
      kind: "chrome",
    });
    expect(doc.nodes["browser-window-7"]).toMatchObject({
      type: "BrowserWindow",
      tabs: ["browser-tab-900"],
      adapter: ["adapter-chrome"],
      externalId: "7",
    });
    expect(doc.nodes["browser-tab-900"]).toMatchObject({
      type: "BrowserTab",
      active: true,
      url: "https://example.com",
      adapter: ["adapter-chrome"],
      externalId: "900",
    });
  });

  it("reconciles browser state into the same graph the UI renders", () => {
    const store = configureStore({ reducer: { graph: graphReducer } });
    store.dispatch(mergeGraph(tabManagerExampleGraph));

    reconcileBrowserSnapshot(store.dispatch, {
      adapterId: "adapter-firefox",
      adapterLabel: "Firefox",
      adapterKind: "firefox",
      windows: [
        {
          id: "2",
          label: "Firefox window",
          focused: true,
          tabs: [
            {
              id: "55",
              title: "MDN",
              url: "https://developer.mozilla.org",
              active: true,
              pinned: false,
            },
          ],
        },
      ],
    });
    attachWindowToApp(store.dispatch, "tab-manager-1", "browser-window-2");

    expect(store.getState().graph.nodes["browser-tab-55"]).toMatchObject({
      type: "BrowserTab",
      title: "MDN",
      adapter: ["adapter-firefox"],
    });
    expect(
      selectLinkedIds(
        { graph: store.getState().graph },
        "tab-manager-1",
        "children",
      ),
    ).toContain("browser-window-2");
  });
});
