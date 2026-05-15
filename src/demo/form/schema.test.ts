import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, mergeGraph } from "../../graph/slice";
import { exportJsonLd } from "../../jsonld/export";
import { importJsonLdDocument } from "../../jsonld/import";
import { selectLinkedIds, selectNode } from "../../graph/selectors";
import { chatbotExampleGraph } from "../chatbot/chatbotExampleGraph";
import { composeGraphDocuments } from "../../graph/document";
import { formExampleGraph } from "./formExampleGraph";
import { formGraphNodeSchema, formSchema } from "./schema";

describe("form schema", () => {
  it("describes canonical form node shapes with Zod", () => {
    for (const node of Object.values(formExampleGraph.nodes)) {
      expect(formGraphNodeSchema.parse(node)).toEqual(node);
    }

    expect(formSchema.context.children).toMatchObject({
      "@type": "@id",
      "@container": "@list",
    });
  });

  it("exports and imports canonical form graph data", async () => {
    const exported = exportJsonLd(formExampleGraph, { rootId: "form-1" });
    const imported = await importJsonLdDocument(exported);

    expect(imported.nodes).toEqual(formExampleGraph.nodes);
    expect(imported.context).toEqual(formExampleGraph.context);
  });

  it("coexists with chatbot nodes in one store", () => {
    const store = configureStore({ reducer: { graph: graphReducer } });
    store.dispatch(
      mergeGraph(composeGraphDocuments([formExampleGraph, chatbotExampleGraph])),
    );

    const rootState = store.getState();

    expect(selectNode(rootState, "form-1")?.type).toBe("Form");
    expect(selectNode(rootState, "conv-1")?.type).toBe("Conversation");
    expect(selectLinkedIds(rootState, "form-1", "children")).toEqual([
      "sec-about",
      "sec-contact",
    ]);
    expect(selectLinkedIds(rootState, "conv-1", "messages")).toEqual([]);
  });
});
