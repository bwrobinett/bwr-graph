import type { AppDispatch } from "../store";
import { deleteNode, insertLink, mergeGraph, removeLink } from "../../graph/slice";
import type { GraphDocument, GraphNode } from "../../graph/types";
import { tabManagerContext } from "./tabManagerSchema";

export interface BrowserSnapshot {
  adapterId: string;
  adapterLabel: string;
  adapterKind: string;
  windows: Array<{
    id: string;
    label: string;
    focused: boolean;
    tabs: Array<{
      id: string;
      title: string;
      url: string;
      active: boolean;
      pinned: boolean;
    }>;
  }>;
}

export function browserSnapshotToGraph(snapshot: BrowserSnapshot): GraphDocument {
  const nodes: Record<string, GraphNode> = {
    [snapshot.adapterId]: {
      id: snapshot.adapterId,
      type: "BrowserAdapter",
      label: snapshot.adapterLabel,
      kind: snapshot.adapterKind,
    },
  };

  for (const win of snapshot.windows) {
    const windowId = `browser-window-${win.id}`;
    nodes[windowId] = {
      id: windowId,
      type: "BrowserWindow",
      label: win.label,
      focused: win.focused,
      tabs: win.tabs.map((tab) => `browser-tab-${tab.id}`),
      adapter: [snapshot.adapterId],
      externalId: win.id,
    };

    for (const tab of win.tabs) {
      const tabId = `browser-tab-${tab.id}`;
      nodes[tabId] = {
        id: tabId,
        type: "BrowserTab",
        title: tab.title,
        url: tab.url,
        active: tab.active,
        pinned: tab.pinned,
        adapter: [snapshot.adapterId],
        externalId: tab.id,
      };
    }
  }

  return { context: tabManagerContext, nodes };
}

export function reconcileBrowserSnapshot(
  dispatch: AppDispatch,
  snapshot: BrowserSnapshot,
): void {
  dispatch(mergeGraph(browserSnapshotToGraph(snapshot)));
}

export function attachWindowToApp(
  dispatch: AppDispatch,
  appId: string,
  windowId: string,
): void {
  dispatch(
    insertLink({
      targetId: windowId,
      at: { nodeId: appId, property: "children" },
    }),
  );
}

export function detachWindowFromApp(
  dispatch: AppDispatch,
  appId: string,
  windowId: string,
): void {
  dispatch(
    removeLink({
      targetId: windowId,
      at: { nodeId: appId, property: "children" },
    }),
  );
  dispatch(deleteNode({ id: windowId }));
}
