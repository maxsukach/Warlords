import { buildFactionDeck, type CardInstance } from "@/lib/cards/instances";
import type { Faction } from "@/lib/cards/catalog";
import type { Player } from "@/game/gameState";

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return { val: x - Math.floor(x), nextSeed: seed };
}

export function shuffle<T>(array: T[], seed: number): { shuffled: T[]; nextSeed: number } {
  let currSeed = seed;
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const { val, nextSeed } = seededRandom(currSeed);
    currSeed = nextSeed;
    const j = Math.floor(val * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return { shuffled: result, nextSeed: currSeed };
}

export function createDeck(faction: Faction, owner: Player): CardInstance[] {
  return buildFactionDeck(faction, owner);
}

export function drawCards(
  deck: CardInstance[],
  hand: CardInstance[],
  discard: CardInstance[],
  limit: number,
  seed: number
): {
  nextDeck: CardInstance[];
  nextHand: CardInstance[];
  nextDiscard: CardInstance[];
  drawnCount: number;
  reshuffles: number;
  nextSeed: number;
  logEntries: string[];
} {
  const needed = limit - hand.length;
  if (needed <= 0) {
    return {
      nextDeck: deck,
      nextHand: hand,
      nextDiscard: discard,
      drawnCount: 0,
      reshuffles: 0,
      nextSeed: seed,
      logEntries: [],
    };
  }

  let currDeck = [...deck];
  let currDiscard = [...discard];
  const currHand = [...hand];
  let currSeed = seed;
  let drawnCount = 0;
  let reshuffles = 0;
  const logEntries: string[] = [];

  for (let i = 0; i < needed; i++) {
    if (currDeck.length === 0) {
      if (currDiscard.length === 0) break;
      const { shuffled, nextSeed } = shuffle(currDiscard, currSeed);
      currDeck = shuffled;
      currDiscard = [];
      currSeed = nextSeed;
      reshuffles++;
      logEntries.push("Deck empty. Reshuffling discard pile.");
    }
    const card = currDeck.shift();
    if (!card) break;
    currHand.push(card);
    drawnCount++;
  }

  return {
    nextDeck: currDeck,
    nextHand: currHand.slice(0, limit),
    nextDiscard: currDiscard,
    drawnCount,
    reshuffles,
    nextSeed: currSeed,
    logEntries,
  };
}
