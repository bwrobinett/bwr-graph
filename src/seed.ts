import { addNode, insertLink, setContext } from "./graph/slice";
import { store } from "./store";

// Seed the demo graph: one form, two sections, four fields.
export function seedDemoGraph() {
  // Tell selectors that `children` holds node references, not literal strings.
  store.dispatch(setContext({ context: { children: "@id" } }));

  store.dispatch(addNode({ id: "form-1", type: "Form", title: "Intake form", children: [] }));
  store.dispatch(addNode({ id: "sec-about", type: "Section", title: "About you", children: [] }));
  store.dispatch(addNode({ id: "sec-contact", type: "Section", title: "Contact", children: [] }));
  store.dispatch(addNode({ id: "f-name", type: "Field", label: "Full name", value: "" }));
  store.dispatch(addNode({ id: "f-role", type: "Field", label: "Role", value: "" }));
  store.dispatch(addNode({ id: "f-email", type: "Field", label: "Email", value: "" }));
  store.dispatch(addNode({ id: "f-phone", type: "Field", label: "Phone", value: "" }));

  store.dispatch(insertLink({ targetId: "sec-about", at: { nodeId: "form-1", property: "children" } }));
  store.dispatch(insertLink({ targetId: "sec-contact", at: { nodeId: "form-1", property: "children" } }));
  store.dispatch(insertLink({ targetId: "f-name", at: { nodeId: "sec-about", property: "children" } }));
  store.dispatch(insertLink({ targetId: "f-role", at: { nodeId: "sec-about", property: "children" } }));
  store.dispatch(insertLink({ targetId: "f-email", at: { nodeId: "sec-contact", property: "children" } }));
  store.dispatch(insertLink({ targetId: "f-phone", at: { nodeId: "sec-contact", property: "children" } }));
}
