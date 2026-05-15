import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, mergeGraph } from "../../graph/slice";
import { exportJsonLd } from "../../jsonld/export";
import { importJsonLdDocument } from "../../jsonld/import";
import { selectLinkedIds, selectNode } from "../../graph/selectors";
import { chatbotExampleGraph } from "../chatbot/chatbotExampleGraph";
import { composeGraphDocuments } from "../../graph/document";
import { formExampleGraph } from "./formExampleGraph";
import { formGraphNodeSchema, formSchema } from "./formSchema";

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
    const formNode = selectNode(rootState, "form-1");
    const conversationNode = selectNode(rootState, "conv-1");
    const rawFormChildren = Array.isArray(formNode?.children) ? formNode.children : [];
    const rawConversationMessages = Array.isArray(conversationNode?.messages)
      ? conversationNode.messages
      : [];
    const formChildren = selectLinkedIds(rootState, "form-1", "children");
    const conversationMessages = selectLinkedIds(rootState, "conv-1", "messages");
    expect(formChildren).toEqual(rawFormChildren);
    expect(conversationMessages).toEqual(rawConversationMessages);
    expect(formChildren.length).toBeGreaterThan(0);
    expect(formChildren.every((id) => selectNode(rootState, id))).toBe(true);
    expect(conversationMessages.every((id) => selectNode(rootState, id))).toBe(true);
  });
});
