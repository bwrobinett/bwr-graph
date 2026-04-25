import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  GraphState,
  GraphNode,
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
    addNode(state, action: PayloadAction<AddNodePayload>) {
      const { id } = action.payload;
      // No-op on duplicate add. Idempotent for re-imports.
      if (state.nodes[id]) return;
      state.nodes[id] = { ...action.payload } as GraphNode;
    },

    updateNode(state, action: PayloadAction<UpdateNodePayload>) {
      const { id, ...updates } = action.payload;
      const node = state.nodes[id];
      if (!node) return;
      // `id` and `type` are intentionally not part of UpdateNodePayload's
      // contract for mutation, but the index signature lets them slip through.
      // Strip them defensively.
      delete (updates as Record<string, unknown>).id;
      delete (updates as Record<string, unknown>).type;
      Object.assign(node, updates);
    },

    deleteNode(state, action: PayloadAction<DeleteNodePayload>) {
      delete state.nodes[action.payload.id];
      // Dangling references are left in place. Selectors filter them.
      // Cleanup is an application-level concern (thunk + reverse index).
    },

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

    setContext(state, action: PayloadAction<SetContextPayload>) {
      const { context, merge } = action.payload;
      state.context = merge ? mergeContexts(state.context, context) : context;
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
} = graphSlice.actions;

export const graphReducer = graphSlice.reducer;
export default graphSlice.reducer;
