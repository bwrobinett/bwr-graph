import type { AppDispatch } from "../store";
import type { RootState } from "../../graph/selectors";
import { addNode, insertLink, updateNode } from "../../graph/slice";
import { selectLinkedIds, selectNode, selectNodes } from "../../graph/selectors";

export function executeBrowserCommand(
  dispatch: AppDispatch,
  getState: () => RootState,
  commandId: string,
): void {
  const command = selectNode(getState(), commandId);
  if (!command) return;

  switch (command.action) {
    case "browser.saveActiveTab":
      saveActiveTab(dispatch, getState);
      return;
    default:
      return;
  }
}

export function saveActiveTab(
  dispatch: AppDispatch,
  getState: () => RootState,
): void {
  const state = getState();
  const activeTab = Object.values(selectNodes(state)).find(
    (node) => node.type === "BrowserTab" && node.active === true,
  );
  if (!activeTab) return;

  const workspaceId = Object.values(selectNodes(state)).find(
    (node) => node.type === "BrowserWorkspace",
  )?.id;
  if (!workspaceId) return;

  const url = String(activeTab.url ?? "");
  if (!url) return;

  const existingId = selectLinkedIds(state, workspaceId, "savedTabs").find((id) => {
    const node = selectNode(state, id);
    return node?.type === "SavedTab" && node.url === url;
  });

  if (existingId) {
    dispatch(
      updateNode({
        id: existingId,
        label: String(activeTab.title ?? url),
        boundTab: [activeTab.id],
      }),
    );
    return;
  }

  const id = `saved-tab-${slugFromUrl(url)}`;
  dispatch(
    addNode({
      id,
      type: "SavedTab",
      label: String(activeTab.title ?? url),
      url,
      boundTab: [activeTab.id],
    }),
  );
  dispatch(
    insertLink({
      targetId: id,
      at: { nodeId: workspaceId, property: "savedTabs" },
    }),
  );
}

function slugFromUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "untitled";
}
