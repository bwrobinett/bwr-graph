import { addNode, insertLink, updateNode } from "../../graph/slice";
import type { AppDispatch } from "../store";
import type { MessageHistoryItem } from "../chatbot/conversation";
import type { Responder } from "../chatbot/responder";

interface GeneratedStory {
  title: string;
  characters: Array<{ name: string; description: string }>;
  scenes: Array<{ title: string; body: string; characterNames: string[] }>;
}

interface GeneratedStoryIdea {
  title: string;
  premise: string;
  tone?: string;
}

export async function generateStoryGraph({
  dispatch,
  writerId,
  runId,
  prompt,
  responder,
  responderName,
}: {
  dispatch: AppDispatch;
  writerId: string;
  runId: string;
  prompt: string;
  responder: Responder;
  responderName: string;
}): Promise<void> {
  dispatch(updateNode({ id: writerId, status: "running", responderName, error: "" }));
  appendLog(dispatch, writerId, "idea", "running", "Asking responder for a fresh short-story idea.");

  try {
    const idea = await requestStoryIdea(prompt, responder);
    commitStoryIdea(dispatch, writerId, runId, idea);
    appendLog(dispatch, writerId, "idea", "complete", `Added StoryIdea node "${idea.title}".`);
    await pauseForGraphView();

    appendLog(dispatch, writerId, "plan", "running", "Generating story graph from the idea node.");
    const generated = await requestStory(idea, responder);
    appendLog(dispatch, writerId, "plan", "complete", `Generated "${generated.title}".`);
    await commitGeneratedStory(dispatch, writerId, runId, generated);
    appendLog(dispatch, writerId, "graph", "complete", "Committed story, scenes, and characters as graph nodes.");
    dispatch(updateNode({ id: writerId, status: "complete", error: "" }));
  } catch (err) {
    const message = (err as Error).message ?? String(err);
    appendLog(dispatch, writerId, "plan", "failed", message);
    dispatch(updateNode({ id: writerId, status: "failed", error: message }));
  }
}

async function requestStoryIdea(
  prompt: string,
  responder: Responder,
): Promise<GeneratedStoryIdea> {
  const history: MessageHistoryItem[] = [
    {
      id: "story-idea-request",
      role: "user",
      content: [
        prompt,
        "",
        "Return only JSON with this exact shape:",
        "{",
        '  "title": "string",',
        '  "premise": "string",',
        '  "tone": "string"',
        "}",
        "Make it specific enough to generate characters and scenes, but do not write the story yet.",
      ].join("\n"),
    },
  ];

  const reply = await responder(history, {
    systemPrompt:
      "You generate compact short-story idea JSON. Do not wrap the JSON in Markdown.",
  });

  return normalizeStoryIdea(parseStoryIdeaJson(reply) ?? fallbackStoryIdea(prompt, reply));
}

async function requestStory(
  idea: GeneratedStoryIdea,
  responder: Responder,
): Promise<GeneratedStory> {
  const history: MessageHistoryItem[] = [
    {
      id: "story-request",
      role: "user",
      content: [
        `Story idea: ${idea.title}`,
        `Premise: ${idea.premise}`,
        idea.tone ? `Tone: ${idea.tone}` : "",
        "",
        "Return only JSON with this exact shape:",
        "{",
        '  "title": "string",',
        '  "characters": [{"name": "string", "description": "string"}],',
        '  "scenes": [{"title": "string", "body": "string", "characterNames": ["string"]}]',
        "}",
        "Use 2-3 characters and 3 short scenes. Keep the full story under 1200 words.",
      ].join("\n"),
    },
  ];

  const reply = await responder(history, {
    systemPrompt:
      "You generate compact short-story JSON. Do not wrap the JSON in Markdown.",
  });

  return normalizeGeneratedStory(parseStoryJson(reply) ?? fallbackStory(idea, reply));
}

function commitStoryIdea(
  dispatch: AppDispatch,
  writerId: string,
  runId: string,
  idea: GeneratedStoryIdea,
): void {
  const id = `${runId}-idea`;
  dispatch(
    addNode({
      id,
      type: "StoryIdea",
      title: idea.title,
      premise: idea.premise,
      tone: idea.tone ?? "",
    }),
  );
  dispatch(
    updateNode({
      id,
      title: idea.title,
      premise: idea.premise,
      tone: idea.tone ?? "",
    }),
  );
  dispatch(insertLink({ targetId: id, at: { nodeId: writerId, property: "storyIdeas" } }));
}

async function commitGeneratedStory(
  dispatch: AppDispatch,
  writerId: string,
  runId: string,
  generated: GeneratedStory,
): Promise<void> {
  const storyId = `${runId}-story`;
  const characterIds = generated.characters.map(
    (_, index) => `${runId}-character-${index + 1}`,
  );
  const sceneIds = generated.scenes.map((_, index) => `${runId}-scene-${index + 1}`);
  const characterIdByName = new Map<string, string>();

  dispatch(
    addNode({
      id: storyId,
      type: "Story",
      title: generated.title,
      scenes: [],
      characters: [],
    }),
  );
  dispatch(
    updateNode({
      id: storyId,
      title: generated.title,
      scenes: [],
      characters: [],
    }),
  );
  dispatch(insertLink({ targetId: storyId, at: { nodeId: writerId, property: "finalStory" } }));
  appendLog(dispatch, writerId, "graph", "complete", `Added Story node "${generated.title}".`);
  await pauseForGraphView();

  for (const [index, character] of generated.characters.entries()) {
    const id = characterIds[index];
    characterIdByName.set(character.name.toLowerCase(), id);
    dispatch(
      addNode({
        id,
        type: "Character",
        name: character.name,
        description: character.description,
      }),
    );
    dispatch(
      updateNode({
        id,
        name: character.name,
        description: character.description,
      }),
    );
    dispatch(insertLink({ targetId: id, at: { nodeId: storyId, property: "characters" } }));
    appendLog(dispatch, writerId, "character", "complete", `Added Character node "${character.name}".`);
    await pauseForGraphView();
  }

  for (const [index, scene] of generated.scenes.entries()) {
    const id = sceneIds[index];
    const sceneCharacterIds = scene.characterNames
      .map((name) => characterIdByName.get(name.toLowerCase()))
      .filter((id): id is string => !!id);
    dispatch(
      addNode({
        id,
        type: "Scene",
        title: scene.title,
        body: scene.body,
        characters: sceneCharacterIds,
      }),
    );
    dispatch(
      updateNode({
        id,
        title: scene.title,
        body: scene.body,
        characters: sceneCharacterIds,
      }),
    );
    dispatch(insertLink({ targetId: id, at: { nodeId: storyId, property: "scenes" } }));
    appendLog(dispatch, writerId, "scene", "complete", `Added Scene node "${scene.title}".`);
    await pauseForGraphView();
  }
}

function appendLog(
  dispatch: AppDispatch,
  writerId: string,
  step: string,
  status: "running" | "complete" | "failed",
  message: string,
): void {
  const id = `${writerId}-log-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  dispatch(addNode({ id, type: "StoryWriterLog", step, status, message }));
  dispatch(insertLink({ targetId: id, at: { nodeId: writerId, property: "logs" } }));
}

function parseStoryJson(text: string): GeneratedStory | null {
  const trimmed = text.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as GeneratedStory;
  } catch {
    return null;
  }
}

function parseStoryIdeaJson(text: string): GeneratedStoryIdea | null {
  const trimmed = text.trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as GeneratedStoryIdea;
  } catch {
    return null;
  }
}

function pauseForGraphView(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 200));
}

function normalizeGeneratedStory(story: GeneratedStory): GeneratedStory {
  const characters = story.characters?.length
    ? story.characters.slice(0, 4)
    : [{ name: "The Finder", description: "someone pulled toward a mystery" }];
  const fallbackNames = characters.map((c) => c.name);
  const scenes = story.scenes?.length
    ? story.scenes.slice(0, 5)
    : fallbackStory(fallbackStoryIdea("", ""), "").scenes;

  return {
    title: story.title?.trim() || "The Small Impossible Door",
    characters: characters.map((c) => ({
      name: c.name?.trim() || "Unnamed",
      description: c.description?.trim() || "waiting to be understood",
    })),
    scenes: scenes.map((s, index) => ({
      title: s.title?.trim() || `Scene ${index + 1}`,
      body: s.body?.trim() || "Something changes quietly.",
      characterNames: s.characterNames?.length ? s.characterNames : fallbackNames,
    })),
  };
}

function normalizeStoryIdea(idea: GeneratedStoryIdea): GeneratedStoryIdea {
  return {
    title: idea.title?.trim() || "The Small Impossible Door",
    premise:
      idea.premise?.trim() ||
      "Someone discovers a tiny impossible door in an ordinary place and must decide whether to open it.",
    tone: idea.tone?.trim() || "warm, strange, and intimate",
  };
}

function fallbackStoryIdea(prompt: string, reply: string): GeneratedStoryIdea {
  const seed = reply && !reply.startsWith("Got it:") ? reply : prompt;
  return {
    title: "The Door Behind the Receipt Printer",
    premise:
      seed ||
      "A night-shift cashier discovers a tiny brass door behind a receipt printer, and a late customer helps her decide what to do with the impossible room beyond it.",
    tone: "warm, slightly strange, and intimate",
  };
}

function fallbackStory(idea: GeneratedStoryIdea, reply: string): GeneratedStory {
  const seed = reply && !reply.startsWith("Got it:") ? reply : idea.premise;
  return {
    title: idea.title || "The Door Behind the Receipt Printer",
    characters: [
      {
        name: "Mara",
        description: "a tired night-shift cashier with a careful eye for impossible things",
      },
      {
        name: "Jun",
        description: "the only customer who notices when the shop grows larger inside",
      },
    ],
    scenes: [
      {
        title: "The Small Sound",
        body:
          "Mara is closing the corner market when a brass doorknob appears behind the receipt printer. It is no bigger than a coin, but when she touches it, a draft comes through smelling of rain and birthday candles.",
        characterNames: ["Mara"],
      },
      {
        title: "A Customer Returns",
        body:
          "Jun comes back for the umbrella he forgot and finds Mara kneeling on the counter, listening at the tiny door. The receipt printer chatters once, printing a map of aisles the store has never had.",
        characterNames: ["Mara", "Jun"],
      },
      {
        title: "Inventory",
        body:
          seed ||
          "Together they open the door and discover a storeroom of small unfinished chances: apologies, songs, letters, and one paper bag labeled tomorrow. Mara chooses a letter. Jun chooses the song. By morning, the market is ordinary again, except both of them know where to knock.",
        characterNames: ["Mara", "Jun"],
      },
    ],
  };
}
