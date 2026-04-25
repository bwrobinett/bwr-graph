import { configureStore, type Store } from "@reduxjs/toolkit";
import { graphReducer, addNode, insertLink, setContext } from "../graph/slice";
import { selectLinkedNodes, selectLinkedIds } from "../graph/selectors";
import type { GraphState, NodeId } from "../graph/types";
import { exportJsonLd } from "../jsonld/export";
import { importJsonLd, type JsonLdDocument } from "../jsonld/import";
import {
  storyContext,
  NODE_TYPE_STORY,
  NODE_TYPE_SCENE,
  NODE_TYPE_CHARACTER,
  type SceneView,
  type CharacterView,
} from "./schema";

interface RootState {
  graph: GraphState;
}

type StoryStore = Store<RootState>;

export interface Story {
  readonly storyId: NodeId;
  addCharacter(name: string, description?: string): CharacterView;
  addScene(title: string, body: string, characterIds?: NodeId[]): SceneView;
  linkCharacterToScene(sceneId: NodeId, characterId: NodeId): void;
  getScenes(): SceneView[];
  getCharacters(): CharacterView[];
  getScenesForCharacter(characterId: NodeId): SceneView[];
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
      type: NODE_TYPE_STORY,
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
  const { context, nodes } = await importJsonLd(doc);
  const store = configureStore({ reducer: { graph: graphReducer } });
  store.dispatch(setContext({ context }));
  for (const node of nodes) store.dispatch(addNode(node));

  const storyId =
    options.storyId ??
    nodes.find((n) => n.type === NODE_TYPE_STORY)?.id ??
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
  const addCharacter = (name: string, description = ""): CharacterView => {
    const id = characterIdGen();
    store.dispatch(
      addNode({
        id,
        type: NODE_TYPE_CHARACTER,
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
  ): SceneView => {
    const id = sceneIdGen();
    store.dispatch(
      addNode({
        id,
        type: NODE_TYPE_SCENE,
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

  const getCharacters = (): CharacterView[] => {
    const characters = selectLinkedNodes(store.getState(), storyId, "characters");
    return characters.map((n) => ({
      id: n.id,
      name: (n.name as string) ?? "",
      description: (n.description as string) ?? "",
    }));
  };

  const sceneToView = (sceneNode: ReturnType<StoryStore["getState"]>["graph"]["nodes"][string]): SceneView => ({
    id: sceneNode.id,
    title: (sceneNode.title as string) ?? "",
    body: (sceneNode.body as string) ?? "",
    characterIds: selectLinkedIds(store.getState(), sceneNode.id, "characters"),
  });

  const getScenes = (): SceneView[] => {
    const scenes = selectLinkedNodes(store.getState(), storyId, "scenes");
    return scenes.map(sceneToView);
  };

  const getScenesForCharacter = (characterId: NodeId): SceneView[] => {
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
