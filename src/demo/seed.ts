import { composeGraphDocuments } from "../graph/document";
import { mergeGraph } from "../graph/slice";
import { chatbotExampleGraph } from "./chatbot/chatbotExampleGraph";
import { composedExampleGraph } from "./composed/composedExampleGraph";
import { demoShellExampleGraph } from "./demo/demoShellExampleGraph";
import { formExampleGraph } from "./form/formExampleGraph";
import { graphViewExampleGraph } from "./graph-view/graphViewExampleGraph";
import { store } from "./store";
import { storyExampleGraph } from "./story/storyExampleGraph";
import { tabManagerExampleGraph } from "./tab-manager/tabManagerExampleGraph";

export function seedDemoGraph(): void {
  store.dispatch(
    mergeGraph(
      composeGraphDocuments([
        formExampleGraph,
        chatbotExampleGraph,
        storyExampleGraph,
        graphViewExampleGraph,
        composedExampleGraph,
        tabManagerExampleGraph,
        demoShellExampleGraph,
      ]),
    ),
  );
}
