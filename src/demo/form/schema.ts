import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for the form-builder showcase.
//
// Aliases `@id` → `componentKey` so the form's external vocabulary uses
// `componentKey` as the node identifier. This is the showcase that proves
// schemas can diverge on identity-property names — chatbot keeps `@id`, form
// uses `componentKey`, and both coexist in one flat node dictionary.
//
// IMPORTANT: keyword aliases MUST use the unambiguous object form
// `{ "@id": "@id" }`. The string-form shorthand `"componentKey": "@id"`
// collides with this codebase's link-property convention (where
// `"parent": "@id"` declares `parent` to be a link property, equivalent to
// the spec form `{ "@type": "@id" }`). The library's `findAliasFor` and
// `narrowContext` helpers only recognise the object form as a keyword alias.
//
// `children` is an ordered link list — preserves field/section order across
// export + re-import. The form's node shapes are otherwise loose: a Form has
// a `title`, a Section has a `title`, a Field has `label` + `value`. View-
// model interfaces below mirror the external vocabulary (with `componentKey`
// in place of `id`); the underlying graph reducer still stores nodes keyed
// by the canonical `id` — the alias only affects the JSON-LD surface.
export const formContext: JsonLdContext = {
  "@vocab": "http://bwr-graph.example/form/",
  componentKey: { "@id": "@id" },
  children: { "@type": "@id", "@container": "@list" },
};

export const NODE_TYPE_FORM = "Form";
export const NODE_TYPE_SECTION = "Section";
export const NODE_TYPE_FIELD = "Field";

export interface FormView {
  componentKey: string;
  title: string;
  childIds: string[];
}

export interface SectionView {
  componentKey: string;
  title: string;
  childIds: string[];
}

export interface FieldView {
  componentKey: string;
  label: string;
  value: string;
}
