export const FACTIONS = ["COSSACKS", "TATARS", "POLAND", "MUSCOVY", "NEUTRAL"] as const;
export type Faction = (typeof FACTIONS)[number];

export const UNIT_TYPES = ["INFANTRY", "ARCHER", "CAVALRY", "SIEGE", "SCOUT", "FORT", "LEADER"] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const CARD_RARITIES = ["BASIC"] as const;
export type CardRarity = (typeof CARD_RARITIES)[number];

export type CardId = string;
export type CardKind = "UNIT" | "STRUCTURE" | "LEADER";
export type CardArtExt = "webp" | "png" | "jpg";

export type CardArt = {
  folder: string;
  baseName: string;
  preferredExt: CardArtExt;
  fallbacks?: Array<{ baseName?: string; ext: CardArtExt }>;
};

export type CardDefinition = {
  id: CardId;
  faction: Faction;
  unitType: UnitType;
  power?: number;
  kind: CardKind;
  art: CardArt;
  displayName?: string;
  shortName?: string;
  rarity?: CardRarity | string;
  deckCount?: number;
  tags?: string[];
};

export const PLACEHOLDER_ART = "/cards/_missing.png";

export function makeCardId(input: { faction: Faction; unitType: UnitType; rarity?: CardRarity; slug?: string }) {
  const factionSlug = input.faction.toLowerCase();
  const typeSlug = input.slug ?? input.unitType.toLowerCase();
  const raritySlug = input.rarity ? `_${input.rarity.toLowerCase()}` : "";
  return `${factionSlug}_${typeSlug}${raritySlug}`;
}

export function isCombatUnit(card: CardDefinition): boolean {
  return ["INFANTRY", "ARCHER", "CAVALRY", "SIEGE", "SCOUT", "LEADER"].includes(card.unitType);
}

export function isStructure(card: CardDefinition): boolean {
  return card.unitType === "FORT";
}

export function assertCardDefinition(x: any): asserts x is CardDefinition {
  if (!x || typeof x !== "object") throw new Error("CardDefinition must be an object");
  const required = ["id", "faction", "unitType", "kind", "art"];
  required.forEach((key) => {
    if (!(key in x)) throw new Error(`CardDefinition missing field: ${key}`);
  });
}
