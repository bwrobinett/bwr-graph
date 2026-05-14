import { addNode, setContext } from "../graph/slice";
import { importJsonLd } from "../jsonld/import";
import { store } from "./store";
import {
  chatbotContext,
  NODE_TYPE_CONVERSATION,
} from "./chatbot/schema";
import { formContext } from "./form/schema";
import { seedDemoShell } from "./demo/seed";

// The form subgraph as a JSON-LD document. Import-pipeline takes it apart and
// dispatches addNode for each node — exactly what an external JSON-LD source
// would feed in.
const demoDoc = {
  "@context": formContext,
  "@graph": [
    {
      "@id": "form-1",
      "@type": "Form",
      title: "Intake form",
      children: [{ "@id": "sec-about" }, { "@id": "sec-contact" }],
    },
    {
      "@id": "sec-about",
      "@type": "Section",
      title: "About you",
      children: [{ "@id": "f-name" }, { "@id": "f-role" }],
    },
    {
      "@id": "sec-contact",
      "@type": "Section",
      title: "Contact",
      children: [{ "@id": "f-email" }, { "@id": "f-phone" }],
    },
    { "@id": "f-name", "@type": "Field", label: "Full name", value: "" },
    { "@id": "f-role", "@type": "Field", label: "Role", value: "" },
    { "@id": "f-email", "@type": "Field", label: "Email", value: "" },
    { "@id": "f-phone", "@type": "Field", label: "Phone", value: "" },
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

  // Meta-showcase: the demo shell itself, as a graph. Tabs are nodes; the
  // active tab is a property on the DemoApp node. The merged demo registry
  // (demo/registry.ts) maps each node type to its renderer.
  seedDemoShell(
    [
      { key: "form", label: "Form", targetId: "form-1" },
      { key: "chat", label: "Chat", targetId: "conv-1" },
    ],
    "form",
  );
}
