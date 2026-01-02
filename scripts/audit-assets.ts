import fs from "node:fs";
import path from "node:path";
import { CARD_ART, PLACEHOLDER, PLACEHOLDER_FALLBACK } from "../src/lib/cardArtRegistry";

const root = path.resolve(process.cwd());
const cardsDir = path.join(root, "public", "cards");

type Issue = { type: "missing" | "orphan"; path: string };

function flattenExpected(): Set<string> {
  const expected = new Set<string>();
  Object.values(CARD_ART).forEach((byUnit) => {
    Object.values(byUnit).forEach((spec) => {
      if (!spec?.key) return;
      const base = spec.key;
      const exts = [
        spec.preferredExt ?? "webp",
        ...(spec.fallbacks ?? []),
        "webp",
        "png",
        "jpg",
      ];
      exts.forEach((ext) => expected.add(`/cards/${base}.${ext}`));
    });
  });
  expected.add(PLACEHOLDER);
  expected.add(PLACEHOLDER_FALLBACK);
  return expected;
}

function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  entries.forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(full));
    } else {
      const rel = path.relative(path.join(root, "public"), full).replace(/\\/g, "/");
      files.push(`/${rel}`);
    }
  });
  return files;
}

function audit() {
  const expected = flattenExpected();
  const actual = listFiles(cardsDir);

  const issues: Issue[] = [];

  expected.forEach((relPath) => {
    const full = path.join(root, "public", relPath.replace(/^\//, ""));
    if (!fs.existsSync(full)) {
      issues.push({ type: "missing", path: relPath });
    }
  });

  actual.forEach((relPath) => {
    if (!expected.has(relPath)) {
      issues.push({ type: "orphan", path: relPath });
    }
  });

  const missing = issues.filter((i) => i.type === "missing");
  const orphaned = issues.filter((i) => i.type === "orphan");

  console.log("Card Art Audit");
  console.log("==============");
  console.log(`Expected assets: ${expected.size}`);
  console.log(`Found assets:    ${actual.length}`);
  console.log(`Missing:         ${missing.length}`);
  console.log(`Orphaned:        ${orphaned.length}`);

  if (missing.length) {
    console.log("\nMissing:");
    missing.forEach((m) => console.log(` - ${m.path}`));
  }
  if (orphaned.length) {
    console.log("\nOrphaned:");
    orphaned.forEach((o) => console.log(` - ${o.path}`));
  }

  if (issues.length === 0) {
    console.log("\nAll good: registry and filesystem are aligned.");
  }
}

audit();
