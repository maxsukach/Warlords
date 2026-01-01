import {
  type CardDefinition,
  type CardId,
  type Faction,
  CARD_RARITIES,
  UNIT_TYPES,
  makeCardId,
  getCardArtUrl,
  assertCardDefinition,
} from "./contract";

const CARD_REGISTRY: CardDefinition[] = [
  {
    id: makeCardId({ faction: "COSSACKS", unitType: "INFANTRY", rarity: "BASIC", slug: "infantry" }),
    faction: "COSSACKS",
    unitType: "INFANTRY",
    rarity: "BASIC",
    name: "Infantry (Basic)",
    power: 2,
    art: { fileBase: "infantry_basic", preferredExt: "png" },
  },
  {
    id: makeCardId({ faction: "COSSACKS", unitType: "ARCHER", rarity: "BASIC", slug: "archer" }),
    faction: "COSSACKS",
    unitType: "ARCHER",
    rarity: "BASIC",
    name: "Archer (Basic)",
    power: 2,
    art: { fileBase: "archer_basic", preferredExt: "png" },
  },
  {
    id: makeCardId({ faction: "COSSACKS", unitType: "CAVALRY", rarity: "BASIC", slug: "cavalry" }),
    faction: "COSSACKS",
    unitType: "CAVALRY",
    rarity: "BASIC",
    name: "Cavalry (Basic)",
    power: 3,
    art: { fileBase: "cavalry_basic", preferredExt: "png" },
  },
  {
    id: makeCardId({ faction: "COSSACKS", unitType: "SCOUT", rarity: "BASIC", slug: "scout" }),
    faction: "COSSACKS",
    unitType: "SCOUT",
    rarity: "BASIC",
    name: "Scout (Basic)",
    power: 1,
    art: { fileBase: "scout_basic", preferredExt: "png" },
  },
  {
    id: "cossacks_siege_cannon_basic",
    faction: "COSSACKS",
    unitType: "SIEGE",
    rarity: "BASIC",
    name: "Siege Cannon",
    power: 4,
    art: { fileBase: "siege_cannon", preferredExt: "png" },
  },
  {
    id: makeCardId({ faction: "COSSACKS", unitType: "LEADER", rarity: "BASIC", slug: "leader" }),
    faction: "COSSACKS",
    unitType: "LEADER",
    rarity: "BASIC",
    name: "Leader (Basic)",
    art: { fileBase: "leader_basic", preferredExt: "png" },
  },
  {
    id: makeCardId({ faction: "COSSACKS", unitType: "FORT", rarity: "BASIC", slug: "fort" }),
    faction: "COSSACKS",
    unitType: "FORT",
    rarity: "BASIC",
    name: "Fort (Basic)",
    art: { fileBase: "fort_basic", preferredExt: "png" },
  },
];

CARD_REGISTRY.forEach((c) => {
  if (!c.art.preferredExt) {
    c.art.preferredExt = "png";
  }
  assertCardDefinition(c);
});

const CARD_BY_ID: Record<CardId, CardDefinition> = {};
CARD_REGISTRY.forEach((c) => {
  if (CARD_BY_ID[c.id]) {
    throw new Error(`Duplicate CardDefinition id: ${c.id}`);
  }
  CARD_BY_ID[c.id] = c;
});

function getCardById(id: CardId): CardDefinition {
  const found = CARD_BY_ID[id];
  if (!found) throw new Error(`CardDefinition not found for id: ${id}`);
  return found;
}

function getCardsByFaction(faction: Faction): CardDefinition[] {
  return CARD_REGISTRY.filter((c) => c.faction === faction);
}

export {
  CARD_REGISTRY,
  CARD_BY_ID,
  getCardById,
  getCardsByFaction,
  getCardArtUrl,
  CARD_RARITIES,
  UNIT_TYPES,
};
