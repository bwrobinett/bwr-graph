import { describe, it, expect } from "vitest";
import { seedDemoGraph } from "../seed";
import { store } from "../store";

/**
 * Smoke test for the real production seed pipeline. Drives the actual
 * `seedDemoGraph()` against the singleton store (same call boot path as
 * `main.tsx`) and verifies the cross-schema link landed.
 *
 * Side-effecty: mutates the module-level singleton store. Other tests use
 * fresh stores; this one specifically tests the production wiring.
 *
 * If this fails: production boot is broken — likely a context/seed ordering
 * issue, not a unit logic bug.
 */
describe("seedDemoGraph (production boot)", () => {
  it("seeds all showcases + the cross-schema embed without throwing", async () => {
    await seedDemoGraph();
    const nodes = store.getState().graph.nodes;

    // All showcase roots present.
    expect(nodes["form-1"]).toBeDefined();
    expect(nodes["conv-1"]).toBeDefined();
    expect(nodes["story-1"]).toBeDefined();
    expect(nodes["graph-view-1"]).toBeDefined();
    expect(nodes["composed-1"]).toBeDefined();
    expect(nodes["tab-manager-1"]).toBeDefined();

    // Demo shell wired up with every tab.
    expect(nodes["app-1"]).toBeDefined();
    const tabIds = nodes["app-1"].tabs as string[];
    expect(tabIds).toEqual([
      "tab-form",
      "tab-chat",
      "tab-story",
      "tab-graph-view",
      "tab-composed",
      "tab-tab-manager",
    ]);

    // The cross-schema link landed: msg-composed-embed.embed → form-1.
    const embedMsg = nodes["msg-composed-embed"];
    expect(embedMsg).toBeDefined();
    expect(embedMsg.embed).toEqual(["form-1"]);

    // composed-1 panels — real link list, in order.
    const composed = nodes["composed-1"];
    expect(composed.panels).toEqual([
      "conv-composed-1",
      "form-1",
      "story-1",
      "graph-view-1",
    ]);
  });
});
