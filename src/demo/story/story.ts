import { configureStore, type Store } from "@reduxjs/toolkit";
import {
  graphReducer,
  addNode,
  insertLink,
  setContext,
  mergeGraph,
} from "../../graph/slice";
import { selectLinkedNodes, selectLinkedIds } from "../../graph/selectors";
import type { GraphState, NodeId } from "../../graph/types";
import { exportJsonLd } from "../../jsonld/export";
import {
  importJsonLdDocument,
  type JsonLdDocument,
} from "../../jsonld/import";
import { storyContext } from "./schema";

interface RootState {
  graph: GraphState;
}

type StoryStore = Store<RootState>;

export interface SceneSummary {
  id: string;
  title: string;
  body: string;
  characterIds: string[];
}

export interface CharacterSummary {
  id: string;
  name: string;
  description: string;
}

export interface Story {
  readonly storyId: NodeId;
  addCharacter(name: string, description?: string): CharacterSummary;
  addScene(title: string, body: string, characterIds?: NodeId[]): SceneSummary;
  linkCharacterToScene(sceneId: NodeId, characterId: NodeId): void;
  getScenes(): SceneSummary[];
  getCharacters(): CharacterSummary[];
  getScenesForCharacter(characterId: NodeId): SceneSummary[];
  toJsonLd(): JsonLdDocument;
  readonly store: StoryStore;
}

export interface CreateStoryOptions {
  storyId?: NodeId;
  title?: string;
  idGen?: { scene?: () => string; character?: () => string };
}

export function createStory(options: CreateStoryOptions = {}): Story {
  const store = configureStore({ reducer: { graph: graphReducer } });
  const storyId = options.storyId ?? "story-1";
  const title = options.title ?? "Untitled";
  const sceneIdGen = options.idGen?.scene ?? makeCounterIdGen("scene");
  const characterIdGen = options.idGen?.character ?? makeCounterIdGen("char");

  store.dispatch(setContext({ context: storyContext }));
  store.dispatch(
    addNode({
      id: storyId,
      type: "Story",
      title,
      scenes: [],
      characters: [],
    }),
  );

  return makeStoryApi(store, storyId, sceneIdGen, characterIdGen);
}

export async function loadStory(
  doc: JsonLdDocument,
  options: { storyId?: NodeId } = {},
): Promise<Story> {
  const graph = await importJsonLdDocument(doc);
  const nodes = Object.values(graph.nodes);
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(mergeGraph(graph));

  const storyId =
    options.storyId ??
    nodes.find((n) => n.type === "Story")?.id ??
    "story-1";

  const sceneIdGen = makeCounterIdGen("scene", nextCounter(nodes, "scene"));
  const characterIdGen = makeCounterIdGen("char", nextCounter(nodes, "char"));

  return makeStoryApi(store, storyId, sceneIdGen, characterIdGen);
}

function makeStoryApi(
  store: StoryStore,
  storyId: NodeId,
  sceneIdGen: () => string,
  characterIdGen: () => string,
): Story {
  const addCharacter = (name: string, description = ""): CharacterSummary => {
    const id = characterIdGen();
    store.dispatch(
      addNode({
        id,
        type: "Character",
        name,
        description,
      }),
    );
    store.dispatch(
      insertLink({
        targetId: id,
        at: { nodeId: storyId, property: "characters" },
      }),
    );
    return { id, name, description };
  };

  const addScene = (
    title: string,
    body: string,
    characterIds: NodeId[] = [],
  ): SceneSummary => {
    const id = sceneIdGen();
    store.dispatch(
      addNode({
        id,
        type: "Scene",
        title,
        body,
        characters: [...characterIds],
      }),
    );
    store.dispatch(
      insertLink({
        targetId: id,
        at: { nodeId: storyId, property: "scenes" },
      }),
    );
    return { id, title, body, characterIds: [...characterIds] };
  };

  const linkCharacterToScene = (sceneId: NodeId, characterId: NodeId): void => {
    store.dispatch(
      insertLink({
        targetId: characterId,
        at: { nodeId: sceneId, property: "characters" },
      }),
    );
  };

  const getCharacters = (): CharacterSummary[] => {
    const characters = selectLinkedNodes(store.getState(), storyId, "characters");
    return characters.map((n) => ({
      id: n.id,
      name: (n.name as string) ?? "",
      description: (n.description as string) ?? "",
    }));
  };

  const sceneToSummary = (sceneNode: ReturnType<StoryStore["getState"]>["graph"]["nodes"][string]): SceneSummary => ({
    id: sceneNode.id,
    title: (sceneNode.title as string) ?? "",
    body: (sceneNode.body as string) ?? "",
    characterIds: selectLinkedIds(store.getState(), sceneNode.id, "characters"),
  });

  const getScenes = (): SceneSummary[] => {
    const scenes = selectLinkedNodes(store.getState(), storyId, "scenes");
    return scenes.map(sceneToSummary);
  };

  const getScenesForCharacter = (characterId: NodeId): SceneSummary[] => {
    return getScenes().filter((s) => s.characterIds.includes(characterId));
  };

  const toJsonLd = (): JsonLdDocument =>
    exportJsonLd(store.getState().graph, { rootId: storyId });

  return {
    storyId,
    addCharacter,
    addScene,
    linkCharacterToScene,
    getScenes,
    getCharacters,
    getScenesForCharacter,
    toJsonLd,
    store,
  };
}

function makeCounterIdGen(prefix: string, start = 1): () => string {
  let n = start;
  return () => `${prefix}-${n++}`;
}

function nextCounter(
  nodes: { id: string }[],
  prefix: string,
): number {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  const nums = nodes
    .map((n) => n.id.match(re))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => Number(m[1]));
  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
}
