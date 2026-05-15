import { formSchema, type FormGraphDocument } from "./formSchema";

export const formExampleGraph = {
  context: formSchema.context,
  nodes: {
    "form-1": {
      id: "form-1",
      type: "Form",
      title: "Intake form",
      children: ["sec-about", "sec-contact"],
    },
    "sec-about": {
      id: "sec-about",
      type: "Section",
      title: "About you",
      children: ["f-name", "f-role"],
    },
    "sec-contact": {
      id: "sec-contact",
      type: "Section",
      title: "Contact",
      children: ["f-email", "f-phone"],
    },
    "f-name": {
      id: "f-name",
      type: "Field",
      label: "Full name",
      value: "",
    },
    "f-role": {
      id: "f-role",
      type: "Field",
      label: "Role",
      value: "",
    },
    "f-email": {
      id: "f-email",
      type: "Field",
      label: "Email",
      value: "",
    },
    "f-phone": {
      id: "f-phone",
      type: "Field",
      label: "Phone",
      value: "",
    },
  },
} satisfies FormGraphDocument;
