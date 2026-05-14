import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for the composed showcase.
//
// `panels` is an ordered link list — points at the root of each showcase
// subgraph this view should display (form-1, conv-composed-1, story-1, …).
// Crucially, the panels link is type-agnostic: a panel can point at ANY node
// from any schema, and the merged registry handles rendering. That's the
// whole punchline — composition is just "link to anything; let the registry
// dispatch."
export const composedContext: JsonLdContext = {
  "@vocab": "http://bwr-graph.example/composed/",
  panels: { "@type": "@id", "@container": "@list" },
};

export const NODE_TYPE_COMPOSED = "Composed";

/** View-model for the composed root. `panelIds` is the list of subgraph roots to render. */
export interface ComposedView {
  id: string;
  title: string;
  panelIds: string[];
}
