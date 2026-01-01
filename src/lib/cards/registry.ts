export type Faction = "cossacks" | "tatars" | "poland";
export type UnitType = "INFANTRY" | "ARCHER" | "CAVALRY" | "SCOUT" | "SIEGE" | "FORT" | "LEADER";
export type CardTier = "basic" | "strong";

export type CardDef = {
  id: string;
  faction: Faction;
  unitType: UnitType;
  tier: CardTier;
  label: string;
  power?: number;
  art: { webp: string; png: string };
};

const buildArtPaths = (faction: Faction, id: string) => ({
  webp: `/cards/${faction}/${id}.webp`,
  png: `/cards/${faction}/${id}.png`,
});

// Naming convention: {id}.{ext}, where id generally follows {kind}_{tier} (e.g., infantry_basic, fort_basic).
// Siege currently uses "siege_cannon" per existing asset naming.
export const CARD_DEFS: CardDef[] = [
  {
    id: "infantry_basic",
    faction: "cossacks",
    unitType: "INFANTRY",
    tier: "basic",
    label: "Infantry (Basic)",
    power: 2,
    art: buildArtPaths("cossacks", "infantry_basic"),
  },
  {
    id: "archer_basic",
    faction: "cossacks",
    unitType: "ARCHER",
    tier: "basic",
    label: "Archer (Basic)",
    power: 2,
    art: buildArtPaths("cossacks", "archer_basic"),
  },
  {
    id: "cavalry_basic",
    faction: "cossacks",
    unitType: "CAVALRY",
    tier: "basic",
    label: "Cavalry (Basic)",
    power: 3,
    art: buildArtPaths("cossacks", "cavalry_basic"),
  },
  {
    id: "scout_basic",
    faction: "cossacks",
    unitType: "SCOUT",
    tier: "basic",
    label: "Scout (Basic)",
    power: 1,
    art: buildArtPaths("cossacks", "scout_basic"),
  },
  {
    id: "siege_cannon",
    faction: "cossacks",
    unitType: "SIEGE",
    tier: "basic",
    label: "Siege Cannon",
    power: 4,
    art: buildArtPaths("cossacks", "siege_cannon"),
  },
  {
    id: "fort_basic",
    faction: "cossacks",
    unitType: "FORT",
    tier: "basic",
    label: "Fort (Basic)",
    art: buildArtPaths("cossacks", "fort_basic"),
  },
  {
    id: "leader_basic",
    faction: "cossacks",
    unitType: "LEADER",
    tier: "basic",
    label: "Leader (Basic)",
    art: buildArtPaths("cossacks", "leader_basic"),
  },
];

export function getCardDefsByFaction(faction: Faction): CardDef[] {
  return CARD_DEFS.filter((c) => c.faction === faction);
}

export function getCardDef(faction: Faction, id: string): CardDef | undefined {
  return CARD_DEFS.find((c) => c.faction === faction && c.id === id);
}

// TODO: Step 7: integrate CARD_DEFS into deck generation / UI card rendering
