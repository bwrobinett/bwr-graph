import { Provider } from "react-redux";
import { store } from "./store";
import { RegistryContext } from "./renderer/RegistryContext";
import { NodeRenderer } from "./renderer/NodeRenderer";
import { formRegistry } from "./components/registry";
import { seedDemoGraph } from "./seed";

seedDemoGraph();

export function App() {
  return (
    <Provider store={store}>
      <main style={{ fontFamily: "system-ui", padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>bwr-graph demo</h1>
        <p style={{ color: "#666" }}>
          A small form rendered from a flat graph. Edit a field — only that
          node's component re-renders.
        </p>
        <RegistryContext.Provider value={formRegistry}>
          <NodeRenderer nodeId="form-1" />
        </RegistryContext.Provider>
      </main>
    </Provider>
  );
}
