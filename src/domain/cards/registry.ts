import {
  type CardArtExt,
  type CardDefinition,
  type CardId,
  type CardKind,
  type Faction,
  type UnitType,
  PLACEHOLDER_ART,
  assertCardDefinition,
  makeCardId,
} from "./contract";

const art = (folder: string, baseName: string, preferredExt: CardArtExt = "png") => ({
  folder,
  baseName,
  preferredExt,
});

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
  art: art(artFolder, artBaseName, "png"),
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

function warnMissingArt(id: CardId) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("CardDefinition missing art metadata:", id);
  }
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

function buildArtPath(folder: string, baseName: string, ext: CardArtExt) {
  return `/cards/${folder}/${baseName}.${ext}`;
}

export function getCardArtCandidates(cardId: CardId): string[] {
  const def = CARD_REGISTRY[cardId];
  if (!def) {
    warnMissingCard(cardId);
    return [PLACEHOLDER_ART];
  }
  const { folder, baseName, preferredExt, fallbacks } = def.art ?? {};
  if (!folder || !baseName || !preferredExt) {
    warnMissingArt(cardId);
    return [PLACEHOLDER_ART];
  }

  const candidates: Array<{ baseName: string; ext: CardArtExt }> = [
    { baseName, ext: preferredExt },
    ...(fallbacks ?? []).map((fallback) => ({
      baseName: fallback.baseName ?? baseName,
      ext: fallback.ext,
    })),
  ];

  const seen = new Set<string>();
  const urls = candidates
    .map((candidate) => buildArtPath(folder, candidate.baseName, candidate.ext))
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });

  if (urls.length === 0) return [PLACEHOLDER_ART];
  if (!seen.has(PLACEHOLDER_ART)) {
    urls.push(PLACEHOLDER_ART);
  }
  return urls;
}

export function getCardArtUrl(cardId: CardId, opts?: { attempt?: number }): string {
  const candidates = getCardArtCandidates(cardId);
  const attempt = opts?.attempt ?? 0;
  return candidates[attempt] ?? PLACEHOLDER_ART;
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
