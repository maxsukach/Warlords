import type { Card } from "@/game/gameState";
import type { UnitType } from "@/lib/cards/catalog";
import { resolveDef } from "@/lib/cards/resolve";

export type BuildingType = "FORT" | "BARRACKS" | "STABLES" | "ARCHERY_RANGE";

export type Building = {
  id: string;
  type: BuildingType;
  owner: "YOU" | "AI";
  level: 1 | 2 | 3;
  isActive: boolean;
};

export function createFort(owner: "YOU" | "AI"): Building {
  return { id: `${owner}-FORT`, type: "FORT", owner, level: 1, isActive: true };
}

export function getActiveBuildings(buildings: Building[]): Building[] {
  return buildings.filter((b) => b.isActive);
}

export function setBuildingsActive(buildings: Building[], isActive: boolean): Building[] {
  return buildings.map((b) => ({ ...b, isActive }));
}

const BUILD_ORDER: BuildingType[] = ["BARRACKS", "STABLES", "ARCHERY_RANGE"];

export function addDefaultBuildingIfAllowed(
  buildings: Building[],
  owner: "YOU" | "AI"
): { next: Building[]; added: Building | null } {
  if (buildings.length >= 2) return { next: buildings, added: null };
  const existingTypes = new Set(buildings.map((b) => b.type));
  const nextType = BUILD_ORDER.find((t) => !existingTypes.has(t));
  if (!nextType) return { next: buildings, added: null };
  const newBuilding: Building = {
    id: `${owner}-${nextType}-${buildings.length + 1}`,
    type: nextType,
    owner,
    level: 1,
    isActive: true,
  };
  return { next: [...buildings, newBuilding], added: newBuilding };
}

function getBonusForUnit(unit: UnitType, buildings: Building[]): number {
  const active = getActiveBuildings(buildings);
  const match = (type: BuildingType) => active.find((b) => b.type === type)?.level ?? 0;
  if (unit === "INFANTRY") return match("BARRACKS");
  if (unit === "CAVALRY") return match("STABLES");
  if (unit === "ARCHER") return match("ARCHERY_RANGE");
  return 0;
}

export function getPowerModifier(card: Card, buildings: Building[]): number {
  const def = resolveDef(card.cardId);
  return getBonusForUnit(def.unit, buildings);
}

export function getFortReduction(buildings: Building[]): number {
  const fort = getActiveBuildings(buildings).find((b) => b.type === "FORT");
  return fort ? 1 : 0;
}

export function applyFortDefense(incomingDamage: number, buildings: Building[]): number {
  const reduction = getFortReduction(buildings);
  const remaining = Math.max(0, incomingDamage - reduction);
  return remaining;
}
