import type { Registry } from "../../../renderer/RegistryContext";
import { BrowserCommandView } from "./BrowserCommandView";
import { BrowserTabView } from "./BrowserTabView";
import { BrowserWindowView } from "./BrowserWindowView";
import { SavedTabView } from "./SavedTabView";
import { TabManagerAppView } from "./TabManagerAppView";
import { TabManagerButtonView } from "./TabManagerButtonView";
import { TabManagerToolbarView } from "./TabManagerToolbarView";
import { BrowserWorkspaceView } from "./BrowserWorkspaceView";

export const tabManagerRegistry: Registry = {
  BrowserCommand: BrowserCommandView,
  BrowserTab: BrowserTabView,
  BrowserWindow: BrowserWindowView,
  BrowserWorkspace: BrowserWorkspaceView,
  SavedTab: SavedTabView,
  TabManagerApp: TabManagerAppView,
  TabManagerButton: TabManagerButtonView,
  TabManagerToolbar: TabManagerToolbarView,
};
