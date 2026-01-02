import { CARD_CATALOG, type CardId, type Faction } from "./catalog";

export interface CardInstance {
  instanceId: string;
  id: string;
  cardId: CardId;
  owner: "YOU" | "AI";
}

const counters: Record<string, number> = {};

function nextCounter(key: string) {
  counters[key] = (counters[key] ?? 0) + 1;
  return counters[key];
}

export function makeInstance(cardId: CardId, owner: "YOU" | "AI", copyIndex?: number): CardInstance {
  const idx = copyIndex ?? nextCounter(`${owner}:${cardId}`);
  const instanceId = `${owner}:${cardId}:${idx}`;
  return {
    instanceId,
    id: instanceId,
    cardId,
    owner,
  };
}

const DECKLISTS: Record<Faction, Array<{ cardId: CardId; count: number }>> = {
  cossacks: [
    { cardId: "cossacks.INFANTRY.basic", count: 6 },
    { cardId: "cossacks.ARCHER.basic", count: 4 },
    { cardId: "cossacks.CAVALRY.basic", count: 4 },
    { cardId: "cossacks.SIEGE.cannon", count: 2 },
    { cardId: "cossacks.SCOUT.basic", count: 2 },
  ],
  tatars: [],
  muscovy: [],
  poland: [],
  neutral: [],
};

export function buildFactionDeck(faction: Faction, owner: "YOU" | "AI"): CardInstance[] {
  const deckDef = DECKLISTS[faction] ?? [];
  const deck: CardInstance[] = [];
  deckDef.forEach(({ cardId, count }) => {
    if (!CARD_CATALOG[cardId]) return;
    for (let i = 1; i <= count; i++) {
      deck.push(makeInstance(cardId, owner, i));
    }
  });
  return deck;
}
