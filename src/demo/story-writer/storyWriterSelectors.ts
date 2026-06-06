import {
  selectLinkedIds,
  selectNode,
  type RootState,
} from "../../graph/selectors";

export function selectStoryWriterMarkdown(
  state: RootState,
  writerId: string,
): string {
  const storyId = selectLinkedIds(state, writerId, "finalStory")[0];
  if (!storyId) return "";

  const story = selectNode(state, storyId);
  if (!story) return "";

  const lines: string[] = [`# ${String(story.title ?? "Untitled Story")}`];

  const characterIds = selectLinkedIds(state, storyId, "characters");
  if (characterIds.length > 0) {
    lines.push("", "## Characters");
    for (const id of characterIds) {
      const character = selectNode(state, id);
      if (!character) continue;
      lines.push(
        `- **${String(character.name ?? "Unnamed")}**: ${String(
          character.description ?? "",
        )}`,
      );
    }
  }

  const sceneIds = selectLinkedIds(state, storyId, "scenes");
  if (sceneIds.length > 0) {
    lines.push("", "## Story");
    for (const id of sceneIds) {
      const scene = selectNode(state, id);
      if (!scene) continue;
      lines.push("", `### ${String(scene.title ?? "Untitled scene")}`, "");
      lines.push(String(scene.body ?? ""));
    }
  }

  return lines.join("\n");
}

export function selectStoryWriterLiveNodeIds(
  state: RootState,
  writerId: string,
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const add = (id: string | undefined) => {
    if (!id || seen.has(id)) return;
    if (!selectNode(state, id)) return;
    seen.add(id);
    ids.push(id);
  };

  add(writerId);
  for (const id of selectLinkedIds(state, writerId, "logs")) add(id);
  for (const id of selectLinkedIds(state, writerId, "storyIdeas")) add(id);

  const storyId = selectLinkedIds(state, writerId, "finalStory")[0];
  add(storyId);
  if (storyId) {
    for (const id of selectLinkedIds(state, storyId, "characters")) add(id);
    for (const id of selectLinkedIds(state, storyId, "scenes")) {
      add(id);
      for (const characterId of selectLinkedIds(state, id, "characters")) {
        add(characterId);
      }
    }
  }

  return ids;
}
