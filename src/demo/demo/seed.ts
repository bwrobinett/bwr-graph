import { addNode, setContext } from "../../graph/slice";
import { store } from "../store";
import {
  demoShellContext,
  NODE_TYPE_DEMO_APP,
  NODE_TYPE_DEMO_TAB,
} from "./schema";

/**
 * Static description of a tab: which key (hash slug) it uses, what to display
 * in the nav, and which graph node id is its showcase root. The seed turns
 * each entry into a `DemoTab` node and links it onto `app-1.tabs`.
 */
export interface DemoTabSeed {
  key: string;
  label: string;
  targetId: string;
}

/**
 * Seed the meta-showcase: one `DemoApp` node + one `DemoTab` per showcase.
 * Idempotent — uses `addNode`, which is a no-op for existing ids.
 *
 * Caller passes the list of tabs (so demo/seed.ts owns the wiring of which
 * showcases exist; this file owns only the meta-shape).
 */
export function seedDemoShell(tabs: DemoTabSeed[], initialKey?: string): void {
  store.dispatch(setContext({ context: demoShellContext, merge: true }));

  const tabIds = tabs.map((t) => `tab-${t.key}`);
  const activeDemo = initialKey ?? tabs[0]?.key ?? "";

  store.dispatch(
    addNode({
      id: "app-1",
      type: NODE_TYPE_DEMO_APP,
      title: "bwr-graph demo",
      tabs: tabIds,
      activeDemo,
    }),
  );

  for (const tab of tabs) {
    store.dispatch(
      addNode({
        id: `tab-${tab.key}`,
        type: NODE_TYPE_DEMO_TAB,
        key: tab.key,
        label: tab.label,
        target: [tab.targetId],
        app: ["app-1"],
      }),
    );
  }
}
