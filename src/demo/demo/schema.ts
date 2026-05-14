import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for the meta-showcase: the demo shell itself, rendered as
// a graph. A `DemoApp` node owns an ordered list of `DemoTab` nodes plus a
// scalar `activeDemo` key pointing at one of the tabs.
//
// Links:
// - `tabs` (DemoApp → DemoTab[]): the nav order, ordered list.
// - `target` (DemoTab → showcase root): which subgraph this tab activates
//   (`form-1`, `conv-1`, …).
// - `app` (DemoTab → DemoApp): back-ref so a tab can dispatch updates against
//   its owning app without the component knowing the app id at compile time.
export const demoShellContext: JsonLdContext = {
  "@vocab": "http://bwr-graph.example/demo-shell/",
  tabs: { "@type": "@id", "@container": "@list" },
  target: { "@type": "@id" },
  app: { "@type": "@id" },
};

export const NODE_TYPE_DEMO_APP = "DemoApp";
export const NODE_TYPE_DEMO_TAB = "DemoTab";

/** View-model for the shell. `activeDemo` is the `key` of the active DemoTab. */
export interface DemoAppView {
  id: string;
  title: string;
  tabIds: string[];
  activeDemo: string;
}

/** View-model for a single tab. `key` is the hash slug; `targetId` is the showcase root. */
export interface DemoTabView {
  id: string;
  key: string;
  label: string;
  targetId: string;
}
