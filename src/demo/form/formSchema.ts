import { z } from "zod";
import type { JsonLdContext } from "../../graph/types";

// JSON-LD context for the form-builder showcase. `children` is an ordered
// link list; nodes themselves stay canonical (`id` + `type`) internally.
export const formContext = {
  "@vocab": "http://bwr-graph.example/form/",
  children: { "@type": "@id", "@container": "@list" },
} satisfies JsonLdContext;

export const formNodeSchema = z.object({
  id: z.string(),
  type: z.literal("Form"),
  title: z.string(),
  children: z.array(z.string()),
});

export const sectionNodeSchema = z.object({
  id: z.string(),
  type: z.literal("Section"),
  title: z.string(),
  children: z.array(z.string()),
});

export const fieldNodeSchema = z.object({
  id: z.string(),
  type: z.literal("Field"),
  label: z.string(),
  value: z.string(),
});

export const formGraphNodeSchema = z.discriminatedUnion("type", [
  formNodeSchema,
  sectionNodeSchema,
  fieldNodeSchema,
]);

export const formSchema = {
  context: formContext,
  node: formGraphNodeSchema,
} as const;

export type FormGraphNode = z.infer<typeof formGraphNodeSchema>;
export type FormGraphDocument = {
  context: typeof formContext;
  nodes: { [id: string]: FormGraphNode };
};
