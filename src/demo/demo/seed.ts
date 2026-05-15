import { graphDocument } from "../../graph/document";
import type { GraphDocument } from "../../graph/types";
import {
  demoShellContext,
  NODE_TYPE_DEMO_APP,
  NODE_TYPE_DEMO_TAB,
} from "./schema";

/**
 * Static description of a tab: which key (hash slug) it uses, what to display
 * in the nav, and which graph node id is its showcase root. The document
 * factory turns each entry into a `DemoTab` node and links it onto
 * `app-1.tabs`.
 */
export interface DemoTabSeed {
  key: string;
  label: string;
  targetId: string;
}

/**
 * Portable meta-showcase document: one `DemoApp` node + one `DemoTab` per
 * showcase.
 *
 * Caller passes the list of tabs (so demo/seed.ts owns the wiring of which
 * showcases exist; this file owns only the meta-shape).
 */
export function demoShellDocument(
  tabs: DemoTabSeed[],
  initialKey?: string,
): GraphDocument {
  const tabIds = tabs.map((t) => `tab-${t.key}`);
  const activeDemo = initialKey ?? tabs[0]?.key ?? "";

  return graphDocument(
    [
      {
        id: "app-1",
        type: NODE_TYPE_DEMO_APP,
        title: "bwr-graph demo",
        tabs: tabIds,
        activeDemo,
      },
      ...tabs.map((tab) => ({
        id: `tab-${tab.key}`,
        type: NODE_TYPE_DEMO_TAB,
        key: tab.key,
        label: tab.label,
        target: [tab.targetId],
        app: ["app-1"],
      })),
    ],
    demoShellContext,
  );
}
