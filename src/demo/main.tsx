import { createRoot } from "react-dom/client";
import { App } from "./App";
import { seedDemoGraph } from "./seed";

await seedDemoGraph();
createRoot(document.getElementById("root")!).render(<App />);
