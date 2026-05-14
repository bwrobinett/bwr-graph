import { configureStore } from "@reduxjs/toolkit";
import { graphReducer } from "../graph/slice";

export const store = configureStore({
  reducer: {
    graph: graphReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
