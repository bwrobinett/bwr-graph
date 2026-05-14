import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { argv, exit, stdout } from "node:process";
import { createStory, loadStory, type Story } from "./story";

const HELP = `
bwr-story — inspect or build a story graph (proves multi-reference graphs work).

Usage:
  npm run story -- <command> [args]

Commands:
  demo                                 Build the sample story in memory and print it
  show <story.jsonld>                  Print all scenes + their characters
  characters <story.jsonld>            List all characters
  appearances <story.jsonld> <name>    Show every scene a character appears in
  save <out.jsonld>                    Build the demo story and write it to <out.jsonld>
  help                                 Show this help
`.trim();

async function main(): Promise<void> {
  const [, , cmd, ...rest] = argv;

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    console.log(HELP);
    return;
  }

  switch (cmd) {
    case "demo":
      printStory(buildDemoStory());
      return;

    case "show": {
      const story = await loadFromArg(rest[0]);
      printStory(story);
      return;
    }

    case "characters": {
      const story = await loadFromArg(rest[0]);
      const chars = story.getCharacters();
      if (chars.length === 0) {
        console.log("(no characters)");
        return;
      }
      for (const c of chars) {
        const desc = c.description ? ` — ${c.description}` : "";
        console.log(`${c.name}${desc}`);
      }
      return;
    }

    case "appearances": {
      const story = await loadFromArg(rest[0]);
      const name = rest[1];
      if (!name) die("usage: appearances <story.jsonld> <name>");
      const character = story
        .getCharacters()
        .find((c) => c.name.toLowerCase() === name.toLowerCase());
      if (!character) die(`character not found: ${name}`);
      const scenes = story.getScenesForCharacter(character.id);
      if (scenes.length === 0) {
        console.log(`${character.name} appears in 0 scenes.`);
        return;
      }
      console.log(`${character.name} appears in ${scenes.length} scene(s):`);
      for (const s of scenes) console.log(`  - ${s.title}`);
      return;
    }

    case "save": {
      const out = rest[0];
      if (!out) die("usage: save <out.jsonld>");
      const story = buildDemoStory();
      const path = resolve(out);
      await writeFile(path, JSON.stringify(story.toJsonLd(), null, 2), "utf8");
      stdout.write(`saved to ${path}\n`);
      return;
    }

    default:
      die(`unknown command: ${cmd}\n\n${HELP}`);
  }
}

function buildDemoStory(): Story {
  const story = createStory({ title: "A Trip Across Town" });
  const alice = story.addCharacter("Alice", "the visitor");
  const bob = story.addCharacter("Bob", "the cafe owner");
  const carol = story.addCharacter("Carol", "Alice's old friend");

  story.addScene(
    "Arrival",
    "Alice steps off the train and meets Bob at the platform.",
    [alice.id, bob.id],
  );
  story.addScene(
    "Cafe afternoon",
    "Bob brews espresso while Alice and Carol catch up.",
    [alice.id, bob.id, carol.id],
  );
  story.addScene(
    "Goodbye",
    "Alice and Carol walk back to the station as the sun sets.",
    [alice.id, carol.id],
  );

  return story;
}

function printStory(story: Story): void {
  const scenes = story.getScenes();
  const characterById = new Map(
    story.getCharacters().map((c) => [c.id, c.name]),
  );
  console.log(`Story (${scenes.length} scene${scenes.length === 1 ? "" : "s"}):`);
  for (const s of scenes) {
    const cast = s.characterIds
      .map((id) => characterById.get(id) ?? id)
      .join(", ");
    console.log(`\n  ${s.title}`);
    if (cast) console.log(`    cast: ${cast}`);
    if (s.body) console.log(`    ${s.body}`);
  }
  console.log();
}

async function loadFromArg(path: string | undefined): Promise<Story> {
  if (!path) die("expected a JSON-LD file path");
  const raw = await readFile(resolve(path!), "utf8");
  return loadStory(JSON.parse(raw));
}

function die(message: string): never {
  console.error(message);
  exit(1);
}

main().catch((err) => {
  console.error(err);
  exit(1);
});
