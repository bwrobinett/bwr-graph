import { describe, it, expect } from "vitest";
import {
  graphReducer,
  addNode,
  updateNode,
  deleteNode,
  insertLink,
  removeLink,
  setContext,
  mergeGraph,
  replaceGraph,
} from "./slice";
import {
  selectNode,
  selectLinkedNodes,
  selectLinkedIds,
  selectSubtreeIds,
  type RootState,
} from "./selectors";

const wrap = (graph: ReturnType<typeof graphReducer>): RootState => ({ graph });

describe("addNode", () => {
  it("adds a node to empty state", () => {
    const state = graphReducer(undefined, addNode({ id: "n1", type: "Form" }));
    expect(state.nodes["n1"]).toEqual({ id: "n1", type: "Form" });
  });

  it("no-ops on duplicate id", () => {
    let state = graphReducer(undefined, addNode({ id: "n1", type: "Form", a: 1 }));
    state = graphReducer(state, addNode({ id: "n1", type: "Form", a: 999 }));
    expect(state.nodes["n1"].a).toBe(1);
  });

  it("preserves all property types", () => {
    const state = graphReducer(
      undefined,
      addNode({
        id: "n1",
        type: "Field",
        label: "Name",
        count: 3,
        active: true,
        empty: null,
        children: ["c1", "c2"],
      }),
    );
    expect(state.nodes["n1"]).toMatchObject({
      label: "Name",
      count: 3,
      active: true,
      empty: null,
      children: ["c1", "c2"],
    });
  });
});

describe("updateNode", () => {
  it("merges updates without clobbering untouched props", () => {
    let state = graphReducer(undefined, addNode({ id: "n1", type: "Field", label: "A", value: "x" }));
    state = graphReducer(state, updateNode({ id: "n1", value: "y" }));
    expect(state.nodes["n1"]).toMatchObject({ label: "A", value: "y" });
  });

  it("replaces link arrays whole", () => {
    let state = graphReducer(undefined, addNode({ id: "f1", type: "Form", children: ["a", "b", "c"] }));
    state = graphReducer(state, updateNode({ id: "f1", children: ["z"] }));
    expect(state.nodes["f1"].children).toEqual(["z"]);
  });

  it("no-ops on missing node", () => {
    const state = graphReducer(undefined, updateNode({ id: "ghost", value: "x" }));
    expect(state.nodes["ghost"]).toBeUndefined();
  });

  it("ignores attempts to mutate type via the payload", () => {
    let state = graphReducer(undefined, addNode({ id: "n1", type: "Form" }));
    state = graphReducer(state, updateNode({ id: "n1", type: "OtherForm" } as never));
    expect(state.nodes["n1"].type).toBe("Form");
  });
});

describe("deleteNode", () => {
  it("removes the node", () => {
    let state = graphReducer(undefined, addNode({ id: "n1", type: "Form" }));
    state = graphReducer(state, deleteNode({ id: "n1" }));
    expect(state.nodes["n1"]).toBeUndefined();
  });

  it("leaves dangling references intact", () => {
    let state = graphReducer(undefined, addNode({ id: "f1", type: "Form", children: ["c1"] }));
    state = graphReducer(state, addNode({ id: "c1", type: "Field" }));
    state = graphReducer(state, deleteNode({ id: "c1" }));
    expect(state.nodes["f1"].children).toEqual(["c1"]); // dangling
    expect(state.nodes["c1"]).toBeUndefined();
  });
});

describe("insertLink", () => {
  it("appends when no index given", () => {
    let state = graphReducer(undefined, addNode({ id: "f1", type: "Form", children: ["a"] }));
    state = graphReducer(state, insertLink({ targetId: "b", at: { nodeId: "f1", property: "children" } }));
    expect(state.nodes["f1"].children).toEqual(["a", "b"]);
  });

  it("inserts at specified index", () => {
    let state = graphReducer(undefined, addNode({ id: "f1", type: "Form", children: ["a", "c"] }));
    state = graphReducer(state, insertLink({ targetId: "b", at: { nodeId: "f1", property: "children", index: 1 } }));
    expect(state.nodes["f1"].children).toEqual(["a", "b", "c"]);
  });

  it("clamps out-of-bounds index", () => {
    let state = graphReducer(undefined, addNode({ id: "f1", type: "Form", children: ["a"] }));
    state = graphReducer(state, insertLink({ targetId: "b", at: { nodeId: "f1", property: "children", index: 99 } }));
    expect(state.nodes["f1"].children).toEqual(["a", "b"]);
  });

  it("creates the array if missing", () => {
    let state = graphReducer(undefined, addNode({ id: "f1", type: "Form" }));
    state = graphReducer(state, insertLink({ targetId: "x", at: { nodeId: "f1", property: "children" } }));
    expect(state.nodes["f1"].children).toEqual(["x"]);
  });

  it("no-ops on missing node", () => {
    const state = graphReducer(undefined, insertLink({ targetId: "x", at: { nodeId: "ghost", property: "children" } }));
    expect(state.nodes["ghost"]).toBeUndefined();
  });
});

describe("removeLink", () => {
  it("removes by index", () => {
    let state = graphReducer(undefined, addNode({ id: "f1", type: "Form", children: ["a", "b", "c"] }));
    state = graphReducer(state, removeLink({ at: { nodeId: "f1", property: "children", index: 1 } }));
    expect(state.nodes["f1"].children).toEqual(["a", "c"]);
  });

  it("removes by targetId (first occurrence)", () => {
    let state = graphReducer(undefined, addNode({ id: "f1", type: "Form", children: ["a", "b", "a"] }));
    state = graphReducer(state, removeLink({ at: { nodeId: "f1", property: "children" }, targetId: "a" }));
    expect(state.nodes["f1"].children).toEqual(["b", "a"]);
  });

  it("no-ops when targetId not found", () => {
    let state = graphReducer(undefined, addNode({ id: "f1", type: "Form", children: ["a"] }));
    state = graphReducer(state, removeLink({ at: { nodeId: "f1", property: "children" }, targetId: "z" }));
    expect(state.nodes["f1"].children).toEqual(["a"]);
  });

  it("no-ops on missing node or non-array property", () => {
    let state = graphReducer(undefined, addNode({ id: "f1", type: "Form", value: "x" }));
    state = graphReducer(state, removeLink({ at: { nodeId: "f1", property: "value", index: 0 } }));
    expect(state.nodes["f1"].value).toBe("x");
  });
});

describe("setContext", () => {
  it("replaces by default", () => {
    let state = graphReducer(undefined, setContext({ context: { a: "@id" } }));
    state = graphReducer(state, setContext({ context: { b: "@id" } }));
    expect(state.context).toEqual({ b: "@id" });
  });

  it("merges when merge:true", () => {
    let state = graphReducer(undefined, setContext({ context: { a: "@id" } }));
    state = graphReducer(state, setContext({ context: { b: "@id" }, merge: true }));
    expect(state.context).toEqual({ a: "@id", b: "@id" });
  });
});

describe("bulk graph document actions", () => {
  it("mergeGraph merges context and upserts nodes in one action", () => {
    let state = graphReducer(
      undefined,
      mergeGraph({
        context: { children: "@id" },
        nodes: {
          parent: { id: "parent", type: "Parent", children: ["child"] },
          child: { id: "child", type: "Child", label: "before" },
        },
      }),
    );

    state = graphReducer(
      state,
      mergeGraph({
        context: { parent: "@id" },
        nodes: {
          child: { id: "child", type: "Child", label: "after" },
          grandchild: { id: "grandchild", type: "Child", parent: ["child"] },
        },
      }),
    );

    expect(state.context).toEqual({ children: "@id", parent: "@id" });
    expect(state.nodes["child"].label).toBe("after");
    expect(Object.keys(state.nodes).sort()).toEqual([
      "child",
      "grandchild",
      "parent",
    ]);
  });

  it("replaceGraph swaps out the whole graph", () => {
    let state = graphReducer(
      undefined,
      addNode({ id: "old", type: "Old" }),
    );

    state = graphReducer(
      state,
      replaceGraph({
        context: { next: "@id" },
        nodes: {
          next: { id: "next", type: "Next" },
        },
      }),
    );

    expect(state).toEqual({
      context: { next: "@id" },
      nodes: {
        next: { id: "next", type: "Next" },
      },
    });
  });
});

describe("selectors with @context", () => {
  it("selectLinkedNodes returns [] when property isn't declared as link", () => {
    let state = graphReducer(undefined, addNode({ id: "n1", type: "Note", tags: ["urgent", "draft"] }));
    state = graphReducer(state, setContext({ context: { tags: { "@container": "@list" } } }));
    expect(selectLinkedNodes(wrap(state), "n1", "tags")).toEqual([]);
    expect(selectLinkedIds(wrap(state), "n1", "tags")).toEqual([]);
  });

  it("selectLinkedNodes follows @id-typed properties", () => {
    let state = graphReducer(undefined, setContext({ context: { children: "@id" } }));
    state = graphReducer(state, addNode({ id: "f1", type: "Form", children: ["c1", "c2"] }));
    state = graphReducer(state, addNode({ id: "c1", type: "Field", label: "A" }));
    state = graphReducer(state, addNode({ id: "c2", type: "Field", label: "B" }));
    const linked = selectLinkedNodes(wrap(state), "f1", "children");
    expect(linked.map((n) => n.label)).toEqual(["A", "B"]);
  });

  it("default behavior with no context entry: NOT a link", () => {
    // Without context, an array could just be literal strings — the selector
    // refuses to traverse without explicit `@type: @id` declaration.
    let state = graphReducer(undefined, addNode({ id: "f1", type: "Form", children: ["c1"] }));
    state = graphReducer(state, addNode({ id: "c1", type: "Field", label: "X" }));
    expect(selectLinkedNodes(wrap(state), "f1", "children")).toEqual([]);
    expect(selectLinkedIds(wrap(state), "f1", "children")).toEqual([]);
  });

  it("literal arrays coexist with link arrays via @context", () => {
    let state = graphReducer(
      undefined,
      setContext({
        context: {
          children: "@id",
          tags: { "@container": "@list" },
        },
      }),
    );
    state = graphReducer(state, addNode({
      id: "f1", type: "Form",
      children: ["c1"],
      tags: ["urgent", "draft"],
    }));
    state = graphReducer(state, addNode({ id: "c1", type: "Field" }));
    expect(selectLinkedIds(wrap(state), "f1", "children")).toEqual(["c1"]);
    expect(selectLinkedIds(wrap(state), "f1", "tags")).toEqual([]);
  });

  it("selectLinkedNodes filters dangling references", () => {
    let state = graphReducer(undefined, setContext({ context: { children: "@id" } }));
    state = graphReducer(state, addNode({ id: "f1", type: "Form", children: ["c1", "ghost"] }));
    state = graphReducer(state, addNode({ id: "c1", type: "Field", label: "Real" }));
    expect(selectLinkedNodes(wrap(state), "f1", "children").map((n) => n.label)).toEqual(["Real"]);
  });
});

describe("selectSubtreeIds", () => {
  it("BFS-traverses a tree via a link property", () => {
    let state = graphReducer(undefined, setContext({ context: { children: "@id" } }));
    state = graphReducer(state, addNode({ id: "root", type: "Form", children: ["a", "b"] }));
    state = graphReducer(state, addNode({ id: "a", type: "Section", children: ["a1"] }));
    state = graphReducer(state, addNode({ id: "b", type: "Section", children: [] }));
    state = graphReducer(state, addNode({ id: "a1", type: "Field" }));
    expect(selectSubtreeIds(wrap(state), "root", "children")).toEqual(["root", "a", "b", "a1"]);
  });

  it("handles cycles", () => {
    let state = graphReducer(undefined, setContext({ context: { next: "@id" } }));
    state = graphReducer(state, addNode({ id: "a", type: "X", next: ["b"] }));
    state = graphReducer(state, addNode({ id: "b", type: "X", next: ["a"] }));
    expect(selectSubtreeIds(wrap(state), "a", "next")).toEqual(["a", "b"]);
  });

  it("does not traverse properties that aren't @id-typed", () => {
    // No context — `children` isn't declared as a link.
    let state = graphReducer(undefined, addNode({ id: "root", type: "X", children: ["a"] }));
    state = graphReducer(state, addNode({ id: "a", type: "X" }));
    expect(selectSubtreeIds(wrap(state), "root", "children")).toEqual(["root"]);
  });
});

describe("integration: form-style graph", () => {
  it("builds and traverses Form → Section → Field", () => {
    let state = graphReducer(undefined, setContext({ context: { children: "@id" } }));
    state = graphReducer(state, addNode({ id: "form", type: "Form", title: "Intake", children: [] }));
    state = graphReducer(state, addNode({ id: "sec1", type: "Section", title: "About you", children: [] }));
    state = graphReducer(state, addNode({ id: "field1", type: "Field", label: "Name", value: "" }));
    state = graphReducer(state, insertLink({ targetId: "sec1", at: { nodeId: "form", property: "children" } }));
    state = graphReducer(state, insertLink({ targetId: "field1", at: { nodeId: "sec1", property: "children" } }));

    expect(selectNode(wrap(state), "form")?.title).toBe("Intake");
    const sections = selectLinkedNodes(wrap(state), "form", "children");
    expect(sections).toHaveLength(1);
    const fields = selectLinkedNodes(wrap(state), sections[0]!.id, "children");
    expect(fields[0]?.label).toBe("Name");
  });
});
