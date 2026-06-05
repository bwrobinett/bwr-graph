import { tabManagerSchema, type TabManagerGraphDocument } from "./tabManagerSchema";

export const tabManagerExampleGraph = {
  context: tabManagerSchema.context,
  nodes: {
    "tab-manager-1": {
      id: "tab-manager-1",
      type: "TabManagerApp",
      title: "Graph browser",
      children: [
        "tab-manager-toolbar",
        "workspace-main",
        "browser-window-main",
      ],
    },
    "tab-manager-toolbar": {
      id: "tab-manager-toolbar",
      type: "TabManagerToolbar",
      children: ["button-save-active"],
    },
    "button-save-active": {
      id: "button-save-active",
      type: "TabManagerButton",
      label: "Save active tab",
      command: ["command-save-active-tab"],
    },
    "command-save-active-tab": {
      id: "command-save-active-tab",
      type: "BrowserCommand",
      label: "Save active tab",
      action: "browser.saveActiveTab",
    },
    "adapter-fake-browser": {
      id: "adapter-fake-browser",
      type: "BrowserAdapter",
      label: "Fake browser adapter",
      kind: "fake-browser",
    },
    "workspace-main": {
      id: "workspace-main",
      type: "BrowserWorkspace",
      label: "Saved tabs",
      savedTabs: ["saved-tab-docs"],
    },
    "saved-tab-docs": {
      id: "saved-tab-docs",
      type: "SavedTab",
      label: "bwr-graph docs",
      url: "https://github.com/bwrobinett/bwr-graph",
      boundTab: ["browser-tab-docs"],
    },
    "browser-window-main": {
      id: "browser-window-main",
      type: "BrowserWindow",
      label: "Main window",
      focused: true,
      tabs: ["browser-tab-docs", "browser-tab-ideas"],
      adapter: ["adapter-fake-browser"],
      externalId: "1",
    },
    "browser-tab-docs": {
      id: "browser-tab-docs",
      type: "BrowserTab",
      title: "bwr-graph",
      url: "https://github.com/bwrobinett/bwr-graph",
      active: true,
      pinned: false,
      adapter: ["adapter-fake-browser"],
      externalId: "101",
    },
    "browser-tab-ideas": {
      id: "browser-tab-ideas",
      type: "BrowserTab",
      title: "Graph store - Tab manager",
      url: "obsidian://open?vault=Obsidian&file=_kim%2FSkills%2Fproj-bwr-graph",
      active: false,
      pinned: true,
      adapter: ["adapter-fake-browser"],
      externalId: "102",
    },
  },
} satisfies TabManagerGraphDocument;
