import fs from "node:fs";
import path from "node:path";
import { CARD_ART, PLACEHOLDER, PLACEHOLDER_FALLBACK } from "../src/lib/cardArtRegistry";

const root = path.resolve(process.cwd());
const publicDir = path.join(root, "public");

function expectedPaths(): Set<string> {
  const set = new Set<string>();
  Object.values(CARD_ART).forEach((byUnit) => {
    Object.values(byUnit).forEach((spec) => {
      if (!spec?.key) return;
      const exts = [
        spec.preferredExt ?? "webp",
        ...(spec.fallbacks ?? []),
        "png",
        "jpg",
      ];
      exts.forEach((ext) => set.add(`/cards/${spec.key}.${ext}`));
    });
  });
  set.add(PLACEHOLDER);
  set.add(PLACEHOLDER_FALLBACK);
  return set;
}

function fileExists(relPath: string) {
  const full = path.join(publicDir, relPath.replace(/^\//, ""));
  return fs.existsSync(full);
}

function run() {
  const expect = expectedPaths();
  const missing: string[] = [];
  expect.forEach((p) => {
    if (!fileExists(p)) missing.push(p);
  });

  console.log("Verify Card Art");
  console.log("================");
  console.log(`Checked ${expect.size} expected asset variants.`);
  if (missing.length) {
    console.log(`Missing (${missing.length}):`);
    missing.forEach((m) => console.log(` - ${m}`));
    process.exitCode = 1;
  } else {
    console.log("All expected assets present (including placeholders).");
  }
}

run();
