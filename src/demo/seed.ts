import { addNode, setContext } from "../graph/slice";
import { importJsonLd } from "../jsonld/import";
import { store } from "./store";
import {
  chatbotContext,
  NODE_TYPE_CONVERSATION,
} from "./chatbot/schema";
import { formContext } from "./form/schema";
import { seedDemoShell } from "./demo/seed";
import { seedGraphView } from "./graph-view/seed";

// The form subgraph as a JSON-LD document. Import-pipeline takes it apart and
// dispatches addNode for each node — exactly what an external JSON-LD source
// would feed in. Form's `@context` aliases `@id` → `componentKey`, so node
// identifiers live under `componentKey` here. The importer strips the alias
// before flattening (so the canonical `@id` reaches `convertNode`) and
// preserves it on `state.context` so export round-trips through the same
// vocabulary. Chatbot, story, and the demo shell still use `@id`/`id` — they
// share the same flat node dictionary regardless.
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
  const { context, nodes } = await importJsonLd(demoDoc);
  store.dispatch(setContext({ context }));
  for (const node of nodes) {
    store.dispatch(addNode(node));
  }

  // Merge the chatbot context onto the form context so `messages` and
  // `parent` are recognised as link properties — selectLinkedNodes walks them
  // only when declared.
  store.dispatch(setContext({ context: chatbotContext, merge: true }));

  // Seed an empty Conversation. The chat surface mounts on this id; messages
  // are dispatched in by `MessageInputView` as the user interacts.
  store.dispatch(
    addNode({
      id: "conv-1",
      type: NODE_TYPE_CONVERSATION,
      title: "bwr-graph chat",
      messages: [],
    }),
  );

  // Graph-view showcase — generic-render-everything tab. Seeded before
  // seedDemoShell so the shell's own nodes (app-1, tab-*) show up in it too.
  seedGraphView();

  // Meta-showcase: the demo shell itself, as a graph. Tabs are nodes; the
  // active tab is a property on the DemoApp node. The merged demo registry
  // (demo/registry.ts) maps each node type to its renderer.
  seedDemoShell(
    [
      { key: "form", label: "Form", targetId: "form-1" },
      { key: "chat", label: "Chat", targetId: "conv-1" },
      { key: "graph-view", label: "Graph View", targetId: "graph-view-1" },
    ],
    "form",
  );
}
