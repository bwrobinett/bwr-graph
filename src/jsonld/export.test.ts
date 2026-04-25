import { describe, expect, it } from "vitest";
import { importJsonLd } from "./import";
import { exportJsonLd } from "./export";
import type { GraphNode, GraphState } from "../graph/types";

function byId(nodes: GraphNode[]): Record<string, GraphNode> {
  return Object.fromEntries(nodes.map((n) => [n.id, n]));
}

describe("exportJsonLd", () => {
  it("emits a doc with @context and @graph", () => {
    const state: GraphState = {
      context: { children: "@id" },
      nodes: {
        "form-1": {
          id: "form-1",
          type: "Form",
          title: "Intake",
          children: ["sec-1"],
        },
        "sec-1": { id: "sec-1", type: "Section", title: "About" },
      },
    };
    const exported = exportJsonLd(state) as Record<string, unknown>;
    expect(exported["@context"]).toEqual(state.context);
    expect(Array.isArray(exported["@graph"])).toBe(true);
  });

  it("emits singleton link arrays as bare strings", () => {
    const state: GraphState = {
      context: { owner: "@id" },
      nodes: {
        "task-1": {
          id: "task-1",
          type: "Task",
          owner: ["user-1"],
        },
      },
    };
    const exported = exportJsonLd(state) as { "@graph": Array<Record<string, unknown>> };
    expect(exported["@graph"][0].owner).toBe("user-1");
  });

  it("emits multi-element link arrays as string arrays", () => {
    const state: GraphState = {
      context: { children: "@id" },
      nodes: {
        "form-1": {
          id: "form-1",
          type: "Form",
          children: ["sec-1", "sec-2"],
        },
      },
    };
    const exported = exportJsonLd(state) as { "@graph": Array<Record<string, unknown>> };
    expect(exported["@graph"][0].children).toEqual(["sec-1", "sec-2"]);
  });

  it("preserves literal arrays as-is", () => {
    const state: GraphState = {
      context: {},
      nodes: {
        "post-1": {
          id: "post-1",
          type: "Post",
          tags: ["urgent", "draft"],
        },
      },
    };
    const exported = exportJsonLd(state) as { "@graph": Array<Record<string, unknown>> };
    expect(exported["@graph"][0].tags).toEqual(["urgent", "draft"]);
  });

  it("rootId limits export to subtree reachable via link properties", () => {
    const state: GraphState = {
      context: { children: "@id" },
      nodes: {
        "form-1": { id: "form-1", type: "Form", children: ["sec-1"] },
        "sec-1": { id: "sec-1", type: "Section", title: "About" },
        unrelated: { id: "unrelated", type: "Note" },
      },
    };
    const exported = exportJsonLd(state, { rootId: "form-1" }) as {
      "@graph": Array<Record<string, unknown>>;
    };
    const ids = exported["@graph"].map((n) => n["@id"]);
    expect(ids).toContain("form-1");
    expect(ids).toContain("sec-1");
    expect(ids).not.toContain("unrelated");
  });

  it("round-trips through import + export + import", async () => {
    const original = {
      "@context": {
        "@vocab": "http://example.com/",
        children: { "@type": "@id" },
      },
      "@graph": [
        {
          "@id": "form-1",
          "@type": "Form",
          title: "Intake",
          children: [{ "@id": "sec-1" }, { "@id": "sec-2" }],
        },
        { "@id": "sec-1", "@type": "Section", title: "About" },
        { "@id": "sec-2", "@type": "Section", title: "Contact" },
      ],
    };

    const first = await importJsonLd(original);
    const state: GraphState = { context: first.context, nodes: byId(first.nodes) };
    const exported = exportJsonLd(state);

    const second = await importJsonLd(exported);
    expect(byId(second.nodes)).toEqual(state.nodes);
    expect(second.context).toEqual(state.context);
  });
});
