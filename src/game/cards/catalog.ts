import type { CardDefinition, CardId } from "./types";

export const CARD_CATALOG: Record<CardId, CardDefinition> = {
  "INFANTRY": { id: "INFANTRY", name: "Infantry", unitType: "INFANTRY", power: 2, faction: "NEUTRAL", rarity: "COMMON" },
  "ARCHER": { id: "ARCHER", name: "Archer", unitType: "ARCHER", power: 2, faction: "NEUTRAL", rarity: "COMMON" },
  "CAVALRY": { id: "CAVALRY", name: "Cavalry", unitType: "CAVALRY", power: 3, faction: "NEUTRAL", rarity: "UNCOMMON" },
  "SIEGE": { id: "SIEGE", name: "Siege Engine", unitType: "SIEGE", power: 4, faction: "NEUTRAL", rarity: "RARE" },
  "SCOUT": { id: "SCOUT", name: "Scout", unitType: "SCOUT", power: 1, faction: "NEUTRAL", rarity: "COMMON" },
};

export function getCardDefinition(id: CardId): CardDefinition {
  const def = CARD_CATALOG[id];
  if (!def) {
    return { id, name: id, unitType: "INFANTRY", power: 0, faction: "NEUTRAL" };
  }
  return def;
}
