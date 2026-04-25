import { addNode, setContext } from "./graph/slice";
import { importJsonLd } from "./jsonld/import";
import { store } from "./store";

// The demo graph as a JSON-LD document. Import-pipeline takes it apart and
// dispatches addNode for each node — exactly what an external JSON-LD source
// would feed in.
const demoDoc = {
  "@context": {
    "@vocab": "http://bwr-graph.example/",
    children: { "@type": "@id", "@container": "@list" },
  },
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
  const { context, nodes } = await importJsonLd(demoDoc);
  store.dispatch(setContext({ context }));
  for (const node of nodes) {
    store.dispatch(addNode(node));
  }
}
