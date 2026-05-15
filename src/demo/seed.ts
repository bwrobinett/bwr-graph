import { composeGraphDocuments, graphDocument } from "../graph/document";
import { mergeGraph } from "../graph/slice";
import { importJsonLdDocument } from "../jsonld/import";
import { store } from "./store";
import {
  chatbotContext,
  NODE_TYPE_CONVERSATION,
} from "./chatbot/schema";
import { formContext } from "./form/schema";
import { demoShellDocument } from "./demo/seed";
import { graphViewDocument } from "./graph-view/seed";
import { storyDocument } from "./story/seed";
import { composedDocument } from "./composed/seed";

// The form subgraph as a JSON-LD document. Import-pipeline takes it apart into
// a portable GraphDocument before the top-level seed dispatches one bulk graph
// action. Form's `@context` aliases `@id` → `componentKey`, so node identifiers
// live under `componentKey` here. The importer strips the alias before
// flattening (so the canonical `@id` reaches `convertNode`) and preserves it
// on `state.context` so export round-trips through the same vocabulary.
// Chatbot, story, and the demo shell still use `@id`/`id` — they share the
// same flat node dictionary regardless.
const demoDoc = {
  "@context": formContext,
  "@graph": [
    {
      componentKey: "form-1",
      "@type": "Form",
      title: "Intake form",
      children: [{ componentKey: "sec-about" }, { componentKey: "sec-contact" }],
    },
    {
      componentKey: "sec-about",
      "@type": "Section",
      title: "About you",
      children: [{ componentKey: "f-name" }, { componentKey: "f-role" }],
    },
    {
      componentKey: "sec-contact",
      "@type": "Section",
      title: "Contact",
      children: [{ componentKey: "f-email" }, { componentKey: "f-phone" }],
    },
    { componentKey: "f-name", "@type": "Field", label: "Full name", value: "" },
    { componentKey: "f-role", "@type": "Field", label: "Role", value: "" },
    { componentKey: "f-email", "@type": "Field", label: "Email", value: "" },
    { componentKey: "f-phone", "@type": "Field", label: "Phone", value: "" },
  ],
};

export async function seedDemoGraph(): Promise<void> {
  // Form showcase — comes in via the JSON-LD importer to prove the round-trip.
  const formDocument = await importJsonLdDocument(demoDoc);

  // Chatbot context composes with the form context so `messages` and `parent`
  // are recognised as link properties — selectLinkedNodes walks them only when
  // declared.
  const chatbotDocument = graphDocument(
    [
      {
        id: "conv-1",
        type: NODE_TYPE_CONVERSATION,
        title: "bwr-graph chat",
        messages: [],
      },
    ],
    chatbotContext,
  );

  // Story showcase — the same sample story `cli.ts` builds, composed beside
  // the other showcases. (The library still exposes a `createStory()` API with
  // its own private store; this is the UI dual.)
  const story = storyDocument();

  // Graph-view showcase — generic-render-everything tab. It renders the final
  // composed store, including the shell's own nodes (app-1, tab-*).
  const graphView = graphViewDocument();

  // Composed showcase — must run AFTER form/chatbot/story/graph-view have
  // seeded their roots, since the Composed node links to them by id. Also
  // owns the cross-schema demo (a Message whose `embed` link points at
  // `form-1`).
  const composed = composedDocument();

  // Meta-showcase: the demo shell itself, as a graph. Tabs are nodes; the
  // active tab is a property on the DemoApp node. The merged demo registry
  // (demo/registry.ts) maps each node type to its renderer.
  const demoShell = demoShellDocument(
    [
      { key: "form", label: "Form", targetId: "form-1" },
      { key: "chat", label: "Chat", targetId: "conv-1" },
      { key: "story", label: "Story", targetId: "story-1" },
      { key: "graph-view", label: "Graph View", targetId: "graph-view-1" },
      { key: "composed", label: "Composed", targetId: "composed-1" },
    ],
    "form",
  );

  store.dispatch(
    mergeGraph(
      composeGraphDocuments([
        formDocument,
        chatbotDocument,
        story,
        graphView,
        composed,
        demoShell,
      ]),
    ),
  );
}
