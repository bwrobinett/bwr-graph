import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { graphReducer, mergeGraph } from "../../graph/slice";
import { NodeRenderer } from "../../renderer/NodeRenderer";
import { RegistryContext } from "../../renderer/RegistryContext";
import { ChatbotConfigContext } from "../chatbot/components/ChatbotConfigContext";
import type { Responder } from "../chatbot/responder";
import { storyWriterRegistry } from "./components/registry";
import { storyWriterExampleGraph } from "./storyWriterExampleGraph";
import { selectStoryWriterMarkdown } from "./storyWriterSelectors";

const jsonResponder: Responder = async (history) => {
  const last = history[history.length - 1]?.content ?? "";
  if (last.includes('"premise"')) {
    return JSON.stringify({
      title: "The Window Under the Sink",
      premise:
        "A building superintendent finds moonlight under a sink and follows it to an apartment that only exists during leaks.",
      tone: "curious, intimate, and uncanny",
    });
  }
  return JSON.stringify({
    title: "The Window Under the Sink",
    characters: [
      {
        name: "Iris",
        description: "a building superintendent who labels every mystery",
      },
      {
        name: "Nell",
        description: "a neighbor who hears music through old pipes",
      },
    ],
    scenes: [
      {
        title: "Leak Report",
        body: "Iris opens the cabinet and finds moonlight under the sink.",
        characterNames: ["Iris"],
      },
      {
        title: "The Other Apartment",
        body: "Nell recognizes the song coming from the tiny window.",
        characterNames: ["Iris", "Nell"],
      },
    ],
  });
};

function makeStore() {
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(mergeGraph(storyWriterExampleGraph));
  return store;
}

describe("story writer runtime", () => {
  it("renders a runtime node as behavior and commits a story graph", async () => {
    const store = makeStore();

    render(
      <Provider store={store}>
        <ChatbotConfigContext.Provider
          value={{ responder: jsonResponder, responderName: "test-responder" }}
        >
          <RegistryContext.Provider value={storyWriterRegistry}>
            <NodeRenderer nodeId="story-writer-runtime-1" />
          </RegistryContext.Provider>
        </ChatbotConfigContext.Provider>
      </Provider>,
    );

    await waitFor(() => {
      expect(store.getState().graph.nodes["story-writer-1"].status).toBe("complete");
    }, { timeout: 3000 });

    const writer = store.getState().graph.nodes["story-writer-1"];
    expect(writer.storyIdeas).toEqual(["story-writer-1-run-0-idea"]);
    expect(writer.finalStory).toEqual(["story-writer-1-run-0-story"]);
    expect(store.getState().graph.nodes["story-writer-1-run-0-idea"].type).toBe(
      "StoryIdea",
    );
    expect(store.getState().graph.nodes["story-writer-1-run-0-story"].type).toBe(
      "Story",
    );
    expect(store.getState().graph.nodes["story-writer-1-run-0-scene-1"].type).toBe(
      "Scene",
    );
  });

  it("projects the generated story graph as markdown", async () => {
    const store = makeStore();

    store.dispatch(
      mergeGraph({
        context: storyWriterExampleGraph.context,
        nodes: {
          "story-writer-1": {
            ...storyWriterExampleGraph.nodes["story-writer-1"],
            status: "complete",
            storyIdeas: ["idea-quick"],
            finalStory: ["story-quick"],
          },
          "idea-quick": {
            id: "idea-quick",
            type: "StoryIdea",
            title: "Quick Idea",
            premise: "A compact proof of graph projections.",
            tone: "plain",
          },
          "story-quick": {
            id: "story-quick",
            type: "Story",
            title: "Quick Story",
            scenes: ["scene-quick"],
            characters: ["char-quick"],
          },
          "char-quick": {
            id: "char-quick",
            type: "Character",
            name: "Ari",
            description: "the tester",
          },
          "scene-quick": {
            id: "scene-quick",
            type: "Scene",
            title: "Proof",
            body: "The graph becomes markdown.",
            characters: ["char-quick"],
          },
        },
      }),
    );

    const markdown = selectStoryWriterMarkdown(store.getState(), "story-writer-1");
    expect(markdown).toContain("# Quick Story");
    expect(markdown).toContain("## Characters");
    expect(markdown).toContain("### Proof");
    expect(markdown).toContain("The graph becomes markdown.");
  });
});
