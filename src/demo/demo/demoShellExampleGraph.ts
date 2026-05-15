import { demoShellSchema, type DemoShellGraphDocument } from "./demoShellSchema";

export const demoShellExampleGraph = {
  context: demoShellSchema.context,
  nodes: {
    "app-1": {
      id: "app-1",
      type: "DemoApp",
      title: "bwr-graph demo",
      tabs: [
        "tab-form",
        "tab-chat",
        "tab-story",
        "tab-graph-view",
        "tab-composed",
      ],
      activeDemo: "form",
    },
    "tab-form": {
      id: "tab-form",
      type: "DemoTab",
      key: "form",
      label: "Form",
      target: ["form-1"],
      app: ["app-1"],
    },
    "tab-chat": {
      id: "tab-chat",
      type: "DemoTab",
      key: "chat",
      label: "Chat",
      target: ["conv-1"],
      app: ["app-1"],
    },
    "tab-story": {
      id: "tab-story",
      type: "DemoTab",
      key: "story",
      label: "Story",
      target: ["story-1"],
      app: ["app-1"],
    },
    "tab-graph-view": {
      id: "tab-graph-view",
      type: "DemoTab",
      key: "graph-view",
      label: "Graph View",
      target: ["graph-view-1"],
      app: ["app-1"],
    },
    "tab-composed": {
      id: "tab-composed",
      type: "DemoTab",
      key: "composed",
      label: "Composed",
      target: ["composed-1"],
      app: ["app-1"],
    },
  },
} satisfies DemoShellGraphDocument;
