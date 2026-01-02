import {
  type CardDefinition,
  type CardId,
  type CardKind,
  type Faction,
  type UnitType,
  PLACEHOLDER_ART,
  assertCardDefinition,
  makeCardId,
} from "./contract";
import {
  getCardArtCandidates as getArtCandidates,
  PLACEHOLDER_ART as CONTRACT_PLACEHOLDER,
  type Faction as ArtFaction,
  type UnitKey,
} from "@/lib/contract";

const baseCard = (
  id: CardId,
  faction: Faction,
  unitType: UnitType,
  kind: CardKind,
  displayName: string,
  artFolder: string,
  artBaseName: string,
  power?: number,
  deckCount?: number,
): CardDefinition => ({
  id,
  faction,
  unitType,
  kind,
  displayName,
  power,
  deckCount,
  art: {
    folder: artFolder,
    baseName: artBaseName,
    preferredExt: "png",
  },
  rarity: "BASIC",
});

export const CARD_REGISTRY: Record<CardId, CardDefinition> = {
  cossacks_infantry_basic: baseCard(
    makeCardId({ faction: "COSSACKS", unitType: "INFANTRY", rarity: "BASIC", slug: "infantry" }),
    "COSSACKS",
    "INFANTRY",
    "UNIT",
    "Infantry (Basic)",
    "cossacks",
    "infantry_basic",
    2,
    6
  ),
  cossacks_archer_basic: baseCard(
    makeCardId({ faction: "COSSACKS", unitType: "ARCHER", rarity: "BASIC", slug: "archer" }),
    "COSSACKS",
    "ARCHER",
    "UNIT",
    "Archer (Basic)",
    "cossacks",
    "archer_basic",
    2,
    4
  ),
  cossacks_cavalry_basic: baseCard(
    makeCardId({ faction: "COSSACKS", unitType: "CAVALRY", rarity: "BASIC", slug: "cavalry" }),
    "COSSACKS",
    "CAVALRY",
    "UNIT",
    "Cavalry (Basic)",
    "cossacks",
    "cavalry_basic",
    3,
    4
  ),
  cossacks_scout_basic: baseCard(
    makeCardId({ faction: "COSSACKS", unitType: "SCOUT", rarity: "BASIC", slug: "scout" }),
    "COSSACKS",
    "SCOUT",
    "UNIT",
    "Scout (Basic)",
    "cossacks",
    "scout_basic",
    1,
    2
  ),
  cossacks_siege_cannon_basic: baseCard(
    "cossacks_siege_cannon_basic",
    "COSSACKS",
    "SIEGE",
    "UNIT",
    "Siege Cannon",
    "cossacks",
    "siege_cannon",
    4,
    2
  ),
  cossacks_leader_basic: baseCard(
    makeCardId({ faction: "COSSACKS", unitType: "LEADER", rarity: "BASIC", slug: "leader" }),
    "COSSACKS",
    "LEADER",
    "LEADER",
    "Leader (Basic)",
    "cossacks",
    "leader_basic"
  ),
  cossacks_fort_basic: baseCard(
    makeCardId({ faction: "COSSACKS", unitType: "FORT", rarity: "BASIC", slug: "fort" }),
    "COSSACKS",
    "FORT",
    "STRUCTURE",
    "Fort (Basic)",
    "cossacks",
    "fort_basic"
  ),
};

Object.values(CARD_REGISTRY).forEach((card) => {
  assertCardDefinition(card);
});

const PLACEHOLDER_CARD: CardDefinition = {
  id: "placeholder_card",
  faction: "NEUTRAL",
  unitType: "INFANTRY",
  kind: "UNIT",
  displayName: "Unknown Card",
  art: {
    folder: "cards",
    baseName: "PLACEHOLDER",
    preferredExt: "png",
  },
};

function warnMissingCard(id: CardId) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("CardDefinition not found for id:", id);
  }
}

function mapToArt(def: CardDefinition): { faction: ArtFaction; unitType: UnitKey } | null {
  const faction = def.faction?.toLowerCase() as ArtFaction | undefined;
  const unit = def.unitType as UnitKey | undefined;
  if (!faction || !unit) return null;
  return { faction, unitType: unit };
}

export function getCardDef(id: CardId): CardDefinition {
  const found = CARD_REGISTRY[id];
  if (!found) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`CardDefinition not found for id: ${id}`);
    }
    warnMissingCard(id);
    return PLACEHOLDER_CARD;
  }
  return found;
}

export function listCardsByFaction(faction: Faction): CardDefinition[] {
  return Object.values(CARD_REGISTRY).filter((c) => c.faction === faction);
}

export function listCardsByUnitType(unitType: UnitType): CardDefinition[] {
  return Object.values(CARD_REGISTRY).filter((c) => c.unitType === unitType);
}

export function getCardArtCandidates(cardId: CardId): string[] {
  const def = CARD_REGISTRY[cardId];
  if (!def) {
    warnMissingCard(cardId);
    return [PLACEHOLDER_ART];
  }
  const map = mapToArt(def);
  if (!map) return [PLACEHOLDER_ART];
  return getArtCandidates(map.faction, map.unitType);
}

export function getCardArtUrl(cardId: CardId, opts?: { attempt?: number }): string {
  const candidates = getCardArtCandidates(cardId);
  const attempt = opts?.attempt ?? 0;
  return candidates[attempt] ?? CONTRACT_PLACEHOLDER;
}

export function validateCardRegistry(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const ids = Object.keys(CARD_REGISTRY);
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    errors.push("Duplicate card ids found in CARD_REGISTRY.");
  }

  const folderRegex = /^[a-z0-9_-]+$/;
  const baseNameRegex = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

  Object.entries(CARD_REGISTRY).forEach(([key, def]) => {
    if (def.id !== key) {
      errors.push(`CardDefinition id mismatch: key=${key} id=${def.id}`);
    }
    if (!def.art?.folder || !def.art?.baseName) {
      errors.push(`CardDefinition missing art metadata: ${def.id}`);
    }
    if (!def.art?.preferredExt) {
      errors.push(`CardDefinition missing preferredExt: ${def.id}`);
    }
    if (def.art?.folder && def.art.folder !== def.art.folder.toLowerCase()) {
      errors.push(`CardDefinition art folder must be lowercase: ${def.id}`);
    }
    if (def.art?.folder && !folderRegex.test(def.art.folder)) {
      errors.push(`CardDefinition art folder has invalid characters: ${def.id}`);
    }
    if (def.art?.baseName && !baseNameRegex.test(def.art.baseName)) {
      errors.push(`CardDefinition art baseName must be snake_case: ${def.id}`);
    }
    if (def.deckCount !== undefined) {
      if (!Number.isInteger(def.deckCount) || def.deckCount < 0) {
        errors.push(`CardDefinition deckCount must be a non-negative integer: ${def.id}`);
      }
    }
  });

  if (errors.length > 0 && process.env.NODE_ENV !== "production") {
    console.warn("[CardRegistry] Validation issues:", errors);
  }

  return { ok: errors.length === 0, errors };
}

export function getCardById(id: CardId): CardDefinition {
  return getCardDef(id);
}

export function getCardsByFaction(faction: Faction): CardDefinition[] {
  return listCardsByFaction(faction);
}

export { CARD_RARITIES, UNIT_TYPES } from "./contract";
