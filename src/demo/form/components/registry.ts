import type { Registry } from "../../../renderer/RegistryContext";
import { NODE_TYPE_FIELD, NODE_TYPE_FORM, NODE_TYPE_SECTION } from "../schema";
import { Form } from "./Form";
import { Section } from "./Section";
import { Field } from "./Field";

export const formRegistry: Registry = {
  [NODE_TYPE_FORM]: Form,
  [NODE_TYPE_SECTION]: Section,
  [NODE_TYPE_FIELD]: Field,
};
