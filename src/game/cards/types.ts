export type CardId = string;

export type Faction = "NEUTRAL";

export type UnitType = "INFANTRY" | "ARCHER" | "CAVALRY" | "SIEGE" | "SCOUT";

export type CardDefinition = {
  id: CardId;
  name: string;
  unitType: UnitType;
  power: number;
  faction?: Faction;
  rarity?: "COMMON" | "UNCOMMON" | "RARE";
  artKey?: string; // optional art filename without extension; defaults to id
};
