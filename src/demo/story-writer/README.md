# story-writer/

Vertical-slice demo: a short-story generator whose runtime and views are both graph-rendered.

- `storyWriterExampleGraph.ts` seeds a `StoryWriter` node plus a linked `StoryWriterRuntime` node.
- `StoryWriterRuntime` returns `null`; it is rendered through `NodeRenderer` only to keep the non-visual generation process mounted.
- `StoryWriterView` is a visual inspector/editor for the same graph. It shows runtime logs, a live generic graph projection as nodes are added, a markdown projection, the native story registry view, and a generic graph-card override view.
- `storyGeneration.ts` calls the same responder abstraction used by the chatbot demo, then commits ordinary `Story`, `Scene`, and `Character` nodes back into the graph.
- `storyWriterSelectors.ts` proves another projection: the generated graph can become markdown without changing the underlying nodes.

The demo shell owns the runtime through `DemoApp.runtimeRoots`, so even the process wiring stays "nodes all the way down."
