import { CARD_CATALOG, type CardDefinition, type CardId } from "./catalog";
import { getArtUrl } from "./getArtUrl";
import type { CardInstance } from "./instances";

const UNKNOWN: CardDefinition = {
  id: "neutral.INFANTRY.unknown",
  faction: "neutral",
  unit: "INFANTRY",
  variant: "unknown",
  name: "Unknown",
  power: 0,
  art: { faction: "neutral", unit: "INFANTRY" },
};

export function resolveDef(cardId: CardId): CardDefinition {
  const found = CARD_CATALOG[cardId];
  return found ?? UNKNOWN;
}

export function resolveCard(card: CardInstance) {
  const def = resolveDef(card.cardId);
  const artUrl = getArtUrl(def);
  return { instance: card, def, artUrl };
}

