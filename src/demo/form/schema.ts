import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for the form-builder showcase. `children` is an ordered link
// list — preserves field/section order across export + re-import. The form's
// node shapes are otherwise loose: a Form has a `title`, a Section has a
// `title`, a Field has `label` + `value`. View-model interfaces below mirror
// what the components read off each node.
export const formContext: JsonLdContext = {
  "@vocab": "http://bwr-graph.example/form/",
  children: { "@type": "@id", "@container": "@list" },
};

export const NODE_TYPE_FORM = "Form";
export const NODE_TYPE_SECTION = "Section";
export const NODE_TYPE_FIELD = "Field";

export interface FormView {
  id: string;
  title: string;
  childIds: string[];
}

export interface SectionView {
  id: string;
  title: string;
  childIds: string[];
}

export interface FieldView {
  id: string;
  label: string;
  value: string;
}
