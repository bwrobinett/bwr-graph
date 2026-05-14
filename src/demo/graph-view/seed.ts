import { addNode, setContext } from "../../graph/slice";
import { store } from "../store";
import { graphViewContext, NODE_TYPE_GRAPH_VIEW } from "./schema";

/**
 * Seed the graph-view showcase. Merges the showcase's context onto whatever
 * is already in the store (no link properties of its own, just a vocab) and
 * adds the `graph-view-1` root node that the tab targets.
 */
export function seedGraphView(): void {
  store.dispatch(setContext({ context: graphViewContext, merge: true }));
  store.dispatch(
    addNode({
      id: "graph-view-1",
      type: NODE_TYPE_GRAPH_VIEW,
      title: "Graph view",
    }),
  );
}
