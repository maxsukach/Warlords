export type Faction = "cossacks" | "tatars" | "muscovy" | "poland" | "neutral";
export type UnitType = "INFANTRY" | "ARCHER" | "CAVALRY" | "SIEGE" | "SCOUT" | "FORT" | "LEADER";
export type CardVariant = "basic" | "elite" | "cannon" | "ram" | "tower" | string;
export type CardId = `${Faction}.${UnitType}.${string}`;

export interface CardDefinition {
  id: CardId;
  faction: Faction;
  unit: UnitType;
  variant: CardVariant;
  name: string;
  power: number;
  art: {
    faction: Faction;
    unit: UnitType;
    keyOverride?: string;
  };
}

// Canonical catalog for currently supported faction(s). Extend here only.
export const CARD_CATALOG: Record<CardId, CardDefinition> = {
  "cossacks.INFANTRY.basic": {
    id: "cossacks.INFANTRY.basic",
    faction: "cossacks",
    unit: "INFANTRY",
    variant: "basic",
    name: "Infantry (Basic)",
    power: 2,
    art: { faction: "cossacks", unit: "INFANTRY" },
  },
  "cossacks.ARCHER.basic": {
    id: "cossacks.ARCHER.basic",
    faction: "cossacks",
    unit: "ARCHER",
    variant: "basic",
    name: "Archer (Basic)",
    power: 2,
    art: { faction: "cossacks", unit: "ARCHER" },
  },
  "cossacks.CAVALRY.basic": {
    id: "cossacks.CAVALRY.basic",
    faction: "cossacks",
    unit: "CAVALRY",
    variant: "basic",
    name: "Cavalry (Basic)",
    power: 3,
    art: { faction: "cossacks", unit: "CAVALRY" },
  },
  "cossacks.SCOUT.basic": {
    id: "cossacks.SCOUT.basic",
    faction: "cossacks",
    unit: "SCOUT",
    variant: "basic",
    name: "Scout (Basic)",
    power: 1,
    art: { faction: "cossacks", unit: "SCOUT" },
  },
  "cossacks.SIEGE.cannon": {
    id: "cossacks.SIEGE.cannon",
    faction: "cossacks",
    unit: "SIEGE",
    variant: "cannon",
    name: "Siege Cannon",
    power: 4,
    art: { faction: "cossacks", unit: "SIEGE", keyOverride: "cossacks/siege_cannon" },
  },
  "cossacks.FORT.basic": {
    id: "cossacks.FORT.basic",
    faction: "cossacks",
    unit: "FORT",
    variant: "basic",
    name: "Fort (Basic)",
    power: 0,
    art: { faction: "cossacks", unit: "FORT" },
  },
  "cossacks.LEADER.basic": {
    id: "cossacks.LEADER.basic",
    faction: "cossacks",
    unit: "LEADER",
    variant: "basic",
    name: "Leader (Basic)",
    power: 0,
    art: { faction: "cossacks", unit: "LEADER" },
  },
};

export function listByFaction(faction: Faction): CardDefinition[] {
  return Object.values(CARD_CATALOG).filter((c) => c.faction === faction);
}
