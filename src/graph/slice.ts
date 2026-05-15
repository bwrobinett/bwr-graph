import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  GraphState,
  GraphNode,
  GraphDocument,
  AddNodePayload,
  UpdateNodePayload,
  DeleteNodePayload,
  InsertLinkPayload,
  RemoveLinkPayload,
  SetContextPayload,
} from "./types";
import { mergeContexts } from "./context";

const initialState: GraphState = {
  nodes: {},
  context: {},
};

const graphSlice = createSlice({
  name: "graph",
  initialState,
  reducers: {
    /**
     * Insert a node into the dictionary. Idempotent: re-adding the same id is
     * a no-op (so JSON-LD re-imports don't clobber existing state).
     */
    addNode(state, action: PayloadAction<AddNodePayload>) {
      const { id } = action.payload;
      if (state.nodes[id]) return;
      state.nodes[id] = { ...action.payload } as GraphNode;
    },

    /**
     * Patch properties on an existing node (Object.assign-style merge). No-op
     * if the node doesn't exist. `id` and `type` are stripped from the
     * payload — type is structural and shouldn't drift mid-life.
     */
    updateNode(state, action: PayloadAction<UpdateNodePayload>) {
      const { id, ...updates } = action.payload;
      const node = state.nodes[id];
      if (!node) return;
      delete (updates as Record<string, unknown>).id;
      delete (updates as Record<string, unknown>).type;
      Object.assign(node, updates);
    },

    /**
     * Drop a node from the dictionary. Does NOT garbage-collect inbound link
     * references — selectors filter dangling ids when reading. Reverse-index
     * cleanup is an application concern (e.g. a thunk).
     */
    deleteNode(state, action: PayloadAction<DeleteNodePayload>) {
      delete state.nodes[action.payload.id];
    },

    /**
     * Append (or insert) a link in `node[property]`. Creates the array if it
     * doesn't exist. With `at.index`, splices into that position (clamped to
     * `[0, length]`); without, pushes at the end. No-op if the source node
     * doesn't exist.
     */
    insertLink(state, action: PayloadAction<InsertLinkPayload>) {
      const { targetId, at } = action.payload;
      const node = state.nodes[at.nodeId];
      if (!node) return;

      if (!Array.isArray(node[at.property])) {
        node[at.property] = [];
      }
      const arr = node[at.property] as string[];

      if (at.index !== undefined) {
        const idx = Math.max(0, Math.min(at.index, arr.length));
        arr.splice(idx, 0, targetId);
      } else {
        arr.push(targetId);
      }
    },

    /**
     * Remove one entry from a link array. Either `at.index` (positional) or
     * `targetId` (first match wins) identifies the entry; both forms remove a
     * single slot. Does NOT delete the target node — only the reference here.
     */
    removeLink(state, action: PayloadAction<RemoveLinkPayload>) {
      const { at, targetId } = action.payload;
      const node = state.nodes[at.nodeId];
      if (!node) return;

      const arr = node[at.property];
      if (!Array.isArray(arr)) return;

      if (at.index !== undefined) {
        if (at.index >= 0 && at.index < arr.length) {
          arr.splice(at.index, 1);
        }
        return;
      }
      if (targetId !== undefined) {
        const idx = arr.indexOf(targetId);
        if (idx !== -1) arr.splice(idx, 1);
      }
    },

    /**
     * Replace or merge the @context. With `merge: true`, the new context
     * overlays onto the existing one (later entries win); otherwise the
     * context is replaced wholesale.
     */
    setContext(state, action: PayloadAction<SetContextPayload>) {
      const { context, merge } = action.payload;
      state.context = merge ? mergeContexts(state.context, context) : context;
    },

    /**
     * Merge a prepared graph document in one reducer pass. Context entries
     * overlay the existing context, and document nodes upsert by id.
     */
    mergeGraph(state, action: PayloadAction<GraphDocument>) {
      state.context = mergeContexts(state.context, action.payload.context);
      for (const [id, node] of Object.entries(action.payload.nodes)) {
        state.nodes[id] = { ...node };
      }
    },

    /** Replace the entire graph with a prepared portable document. */
    replaceGraph(_state, action: PayloadAction<GraphDocument>) {
      return {
        context: { ...action.payload.context },
        nodes: Object.fromEntries(
          Object.entries(action.payload.nodes).map(([id, node]) => [
            id,
            { ...node },
          ]),
        ),
      };
    },
  },
});

export const {
  addNode,
  updateNode,
  deleteNode,
  insertLink,
  removeLink,
  setContext,
  mergeGraph,
  replaceGraph,
} = graphSlice.actions;

/** The graph reducer — plug into a Redux store under any key (we use `graph`). */
export const graphReducer = graphSlice.reducer;
export default graphSlice.reducer;
