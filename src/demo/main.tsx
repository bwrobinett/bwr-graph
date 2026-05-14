import { createRoot } from "react-dom/client";
import { App } from "./App";
import { seedDemoGraph } from "./seed";
import { store } from "./store";
import { syncHashWithStore } from "./hashSync";

await seedDemoGraph();
syncHashWithStore(store, "app-1");
createRoot(document.getElementById("root")!).render(<App />);
