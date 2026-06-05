import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, mergeGraph } from "../../../graph/slice";
import { RegistryContext } from "../../../renderer/RegistryContext";
import { NodeRenderer } from "../../../renderer/NodeRenderer";
import { tabManagerExampleGraph } from "../tabManagerExampleGraph";
import { tabManagerRegistry } from "./registry";

function makeStore() {
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(mergeGraph(tabManagerExampleGraph));
  return store;
}

function renderTabManager(store = makeStore()) {
  render(
    <Provider store={store}>
      <RegistryContext.Provider value={tabManagerRegistry}>
        <NodeRenderer nodeId="tab-manager-1" />
      </RegistryContext.Provider>
    </Provider>,
  );
  return store;
}

describe("TabManagerAppView", () => {
  it("renders static UI, saved workspace, and live browser state from graph nodes", () => {
    renderTabManager();

    expect(screen.getByTestId("tab-manager-tab-manager-1")).toBeInTheDocument();
    expect(screen.getByTestId("tab-manager-toolbar-tab-manager-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("tab-manager-button-button-save-active")).toHaveTextContent(
      "Save active tab",
    );

    const workspace = screen.getByTestId("browser-workspace-workspace-main");
    expect(within(workspace).getByTestId("saved-tab-saved-tab-docs")).toHaveTextContent(
      "bwr-graph docs",
    );

    const window = screen.getByTestId("browser-window-browser-window-main");
    expect(within(window).getByTestId("browser-tab-browser-tab-docs")).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(within(window).getByTestId("browser-tab-browser-tab-ideas")).toHaveTextContent(
      "Pinned",
    );
  });

  it("executes command nodes by mutating the graph instead of local component state", () => {
    const store = makeStore();
    renderTabManager(store);

    // Remove the existing saved tab to prove the button recreates it from the
    // active BrowserTab node rather than relying on seed data.
    act(() => {
      store.dispatch(
        mergeGraph({
          context: tabManagerExampleGraph.context,
          nodes: {
            "workspace-main": {
              id: "workspace-main",
              type: "BrowserWorkspace",
              label: "Saved tabs",
              savedTabs: [],
            },
          },
        }),
      );
    });
    expect(screen.queryByTestId("saved-tab-saved-tab-docs")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("tab-manager-button-button-save-active"));

    const workspace = screen.getByTestId("browser-workspace-workspace-main");
    expect(within(workspace).getByText("bwr-graph")).toBeInTheDocument();
    expect(
      store.getState().graph.nodes["saved-tab-github-com-bwrobinett-bwr-graph"],
    ).toMatchObject({
      type: "SavedTab",
      url: "https://github.com/bwrobinett/bwr-graph",
      boundTab: ["browser-tab-docs"],
    });
  });
});
