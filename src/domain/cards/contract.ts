export const FACTIONS = ["COSSACKS", "TATARS", "POLAND"] as const;
export type Faction = (typeof FACTIONS)[number];

export const UNIT_TYPES = ["INFANTRY", "ARCHER", "CAVALRY", "SIEGE", "SCOUT", "LEADER", "FORT"] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const CARD_RARITIES = ["BASIC"] as const;
export type CardRarity = (typeof CARD_RARITIES)[number];

export type CardId = string;

export type CardDefinition = {
  id: CardId;
  faction: Faction;
  unitType: UnitType;
  rarity: CardRarity;
  name: string;
  power?: number;
  tags?: string[];
  art: CardArt;
};

export const PLACEHOLDER_ART = "/cards/_missing.png";

export type CardArt = {
  fileBase?: string; // without extension, unless already suffixed with .png/.webp
  preferredExt?: "webp" | "png";
  faction?: string;
};

export function makeCardId(input: { faction: Faction; unitType: UnitType; rarity: CardRarity; slug?: string }) {
  const factionSlug = input.faction.toLowerCase();
  const typeSlug = input.slug ?? input.unitType.toLowerCase();
  return `${factionSlug}_${typeSlug}_${input.rarity.toLowerCase()}`;
}

export function getCardArtUrl(
  art?: CardArt | null,
  opts?: { preferredExt?: "webp" | "png"; fallbackExts?: ("webp" | "png")[]; faction?: string }
) {
  const artObj = art ?? {};
  const fileBase = artObj.fileBase;
  if (!fileBase) return PLACEHOLDER_ART;

  const preferred = opts?.preferredExt ?? artObj.preferredExt ?? "png";
  const fallbackList = opts?.fallbackExts ?? [];
  const candidates = [preferred, ...fallbackList];
  const chosen = candidates.find(Boolean) || "png";

  const baseHasExt = fileBase.endsWith(".png") || fileBase.endsWith(".webp");
  const baseHasCardsPrefix = fileBase.startsWith("/cards/");

  if (baseHasCardsPrefix) {
    return baseHasExt ? fileBase : `${fileBase}.${chosen}`;
  }

  if (fileBase.startsWith("/")) {
    return baseHasExt ? fileBase : `${fileBase}.${chosen}`;
  }

  const faction = (opts?.faction ?? artObj.faction)?.toLowerCase();
  if (!faction) return PLACEHOLDER_ART;
  return baseHasExt ? `/cards/${faction}/${fileBase}` : `/cards/${faction}/${fileBase}.${chosen}`;
}

export function isCombatUnit(card: CardDefinition): boolean {
  return ["INFANTRY", "ARCHER", "CAVALRY", "SIEGE", "SCOUT", "LEADER"].includes(card.unitType);
}

export function isStructure(card: CardDefinition): boolean {
  return card.unitType === "FORT";
}

export function assertCardDefinition(x: any): asserts x is CardDefinition {
  if (!x || typeof x !== "object") throw new Error("CardDefinition must be an object");
  const required = ["id", "faction", "unitType", "rarity", "name", "art"];
  required.forEach((key) => {
    if (!(key in x)) throw new Error(`CardDefinition missing field: ${key}`);
  });
}
