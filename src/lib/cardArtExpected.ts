import { CARD_ART, type CardArtExt, type CardArtSpec, type Faction, type UnitKey } from "./cardArtRegistry";

export type ExpectedFile = {
  faction: Faction;
  unit: UnitKey;
  key: string;
  expectedPath: string;
  resolvedPath: string;
};

export const FACTIONS = Object.keys(CARD_ART) as Faction[];

export const CARD_KEYS_BY_FACTION: Record<Faction, string[]> = FACTIONS.reduce((acc, faction) => {
  const entries = CARD_ART[faction] ?? {};
  acc[faction] = Object.values(entries)
    .map((spec) => spec?.key)
    .filter(Boolean) as string[];
  return acc;
}, {} as Record<Faction, string[]>);

function toPath(spec: CardArtSpec): string {
  const ext: CardArtExt = spec.preferredExt ?? "webp";
  return `/cards/${spec.key}.${ext}`;
}

function buildExpected() {
  const items: ExpectedFile[] = [];
  FACTIONS.forEach((faction) => {
    const entries = CARD_ART[faction] ?? {};
    (Object.keys(entries) as UnitKey[]).forEach((unit) => {
      const spec = entries[unit];
      if (!spec?.key) return;
      const expectedPath = toPath(spec);
      const resolvedPath = expectedPath;
      items.push({
        faction,
        unit,
        key: spec.key,
        expectedPath,
        resolvedPath,
      });
    });
  });
  return items;
}

export const EXPECTED_FILES: ExpectedFile[] = buildExpected();
