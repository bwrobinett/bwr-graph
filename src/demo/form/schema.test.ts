import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer } from "../../graph/slice";
import { addNode, setContext } from "../../graph/slice";
import { importJsonLd } from "../../jsonld/import";
import { exportJsonLd } from "../../jsonld/export";
import type { GraphNode, GraphState } from "../../graph/types";
import { selectLinkedIds, selectNode } from "../../graph/selectors";
import {
  formContext,
  NODE_TYPE_FIELD,
  NODE_TYPE_FORM,
  NODE_TYPE_SECTION,
} from "./schema";
import { chatbotContext, NODE_TYPE_CONVERSATION } from "../chatbot/schema";

// What this file proves
// ---------------------
// The form showcase aliases `@id` → `componentKey` in its JSON-LD context.
// The library is supposed to handle that aliasing transparently: import
// strips the alias before flattening (so canonical `@id` reaches the
// converter); export re-emits using the alias. These tests pin that
// behaviour at the showcase boundary, plus the coexistence claim — form
// nodes (componentKey vocabulary) and chatbot nodes (canonical id) live
// happily in the same flat store.

const seedDoc = {
  "@context": formContext,
  "@graph": [
    {
      componentKey: "form-1",
      "@type": NODE_TYPE_FORM,
      title: "Intake form",
      children: [{ componentKey: "sec-about" }, { componentKey: "sec-contact" }],
    },
    {
      componentKey: "sec-about",
      "@type": NODE_TYPE_SECTION,
      title: "About you",
      children: [{ componentKey: "f-name" }],
    },
    {
      componentKey: "sec-contact",
      "@type": NODE_TYPE_SECTION,
      title: "Contact",
      children: [{ componentKey: "f-email" }],
    },
    { componentKey: "f-name", "@type": NODE_TYPE_FIELD, label: "Full name", value: "" },
    { componentKey: "f-email", "@type": NODE_TYPE_FIELD, label: "Email", value: "" },
  ],
};

function byId(nodes: GraphNode[]): Record<string, GraphNode> {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

describe("form schema — componentKey alias", () => {
  it("imports the form seed doc, landing nodes under canonical `id`", async () => {
    const { context, nodes } = await importJsonLd(seedDoc);

    // Internal storage is still keyed by canonical `id` — the alias only
    // affects the JSON-LD surface, not graph-state shape.
    const form = nodes.find((n) => n.id === "form-1");
    expect(form?.type).toBe(NODE_TYPE_FORM);
    expect(form?.title).toBe("Intake form");
    expect(form?.children).toEqual(["sec-about", "sec-contact"]);

    expect(nodes.find((n) => n.id === "f-name")?.label).toBe("Full name");

    // The alias is preserved on the narrowed context so subsequent export
    // emits using `componentKey` again.
    expect(context.componentKey).toEqual({ "@id": "@id" });
    // Link-property declarations survive narrowing.
    expect(context.children).toMatchObject({
      "@type": "@id",
      "@container": "@list",
    });
  });

  it("exports form-rooted nodes back under the `componentKey` alias", async () => {
    const { context, nodes } = await importJsonLd(seedDoc);
    const state: GraphState = { context, nodes: byId(nodes) };

    const exported = exportJsonLd(state, { rootId: "form-1" }) as {
      "@context": Record<string, unknown>;
      "@graph": Array<Record<string, unknown>>;
    };

    // Every emitted node uses `componentKey`, not `@id`.
    for (const n of exported["@graph"]) {
      expect(n.componentKey).toBeDefined();
      expect(n["@id"]).toBeUndefined();
    }

    const form = exported["@graph"].find((n) => n.componentKey === "form-1");
    expect(form?.["@type"]).toBe(NODE_TYPE_FORM);
    // Link arrays emit as plain string arrays (jsonld.flatten compact form).
    expect(form?.children).toEqual(["sec-about", "sec-contact"]);
  });

  it("round-trips form data through import → export → import", async () => {
    const first = await importJsonLd(seedDoc);
    const state: GraphState = {
      context: first.context,
      nodes: byId(first.nodes),
    };

    const exported = exportJsonLd(state);
    const second = await importJsonLd(exported);

    expect(byId(second.nodes)).toEqual(state.nodes);
    expect(second.context).toEqual(state.context);
  });

  it("coexists with chatbot nodes (which use canonical `id`) in one store", async () => {
    const store = configureStore({ reducer: { graph: graphReducer } });

    // Seed the form via the JSON-LD importer (mirrors src/demo/seed.ts).
    const { context: formCtx, nodes: formNodes } = await importJsonLd(seedDoc);
    store.dispatch(setContext({ context: formCtx }));
    for (const node of formNodes) {
      store.dispatch(addNode(node));
    }

    // Merge chatbot vocabulary on top. The merged context retains
    // form's `componentKey` alias AND chatbot's `messages`/`parent` link
    // properties.
    store.dispatch(setContext({ context: chatbotContext, merge: true }));
    store.dispatch(
      addNode({
        id: "conv-1",
        type: NODE_TYPE_CONVERSATION,
        title: "demo chat",
        messages: [],
      }),
    );

    const rootState = store.getState();

    // Form nodes (came in via componentKey) and chatbot nodes (came in via
    // canonical id) share one flat dictionary.
    expect(selectNode(rootState, "form-1")?.type).toBe(NODE_TYPE_FORM);
    expect(selectNode(rootState, "conv-1")?.type).toBe(NODE_TYPE_CONVERSATION);

    // Form's `children` link property still resolves cleanly.
    expect(selectLinkedIds(rootState, "form-1", "children")).toEqual([
      "sec-about",
      "sec-contact",
    ]);

    // Chatbot's `messages` is empty but recognised as a link property.
    expect(selectLinkedIds(rootState, "conv-1", "messages")).toEqual([]);

    // Both vocabularies live on the merged context.
    expect(rootState.graph.context.componentKey).toEqual({ "@id": "@id" });
    expect(rootState.graph.context.messages).toMatchObject({
      "@type": "@id",
      "@container": "@list",
    });
  });
});
