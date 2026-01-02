import { buildFactionDeck, type CardInstance } from "@/lib/cards/instances";
import { type Faction } from "@/lib/cards/catalog";

/** 
 * CONSTANTS 
 */
export const HAND_LIMIT = 6 as const;
export const STARTING_HP = 20 as const;
export const AI_THINK_MS = 600 as const;

const DEFAULT_DECK_FACTION: Faction = "cossacks";
export const CARDS_PER_PLAYER = 18 as const;

/**
 * TYPES
 */
export type Player = "YOU" | "AI";
export type GameStatus = "PLAYING" | "GAME_OVER";
export type Phase =
  | "SELECT_ACTION"
  | "ATTACK_DECLARE"
  | "DEFENSE_DECLARE"
  | "COMBAT_RESOLUTION"
  | "END_TURN";

export type Card = CardInstance;

export type GameState = {
  turn: number;
  activePlayer: Player;
  phase: Phase;

  deckYou: Card[];
  deckAi: Card[];
  handYou: Card[];
  handAi: Card[];
  discardYou: Card[];
  discardAi: Card[];

  committedAttackCards: Card[];
  committedDefenseCards: Card[];

  selectedAttackIds: string[];
  selectedDefenseIds: string[];

  hpYou: number;
  hpAi: number;

  gameStatus: GameStatus;
  winner: Player | null;

  reveal: {
    visible: boolean;
    title: string;
    cards: Card[];
  } | null;

  combatLog: string[]; // last 1–5
  rngSeed: number;

  metrics: {
    totalDrawsYou: number;
    totalDrawsAi: number;
    totalReshufflesYou: number;
    totalReshufflesAi: number;
  };
};

/**
 * UTILS
 */
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

function createDeck(owner: Player): Card[] {
  return buildFactionDeck(DEFAULT_DECK_FACTION, owner);
}

export function drawCards(deck: Card[], hand: Card[], discard: Card[], limit: number, seed: number): { 
  nextDeck: Card[]; 
  nextHand: Card[]; 
  nextDiscard: Card[]; 
  drawnCount: number; 
  reshuffles: number;
  nextSeed: number; 
  logEntries: string[] 
} {
  const needed = limit - hand.length;
  if (needed <= 0) return { nextDeck: deck, nextHand: hand, nextDiscard: discard, drawnCount: 0, reshuffles: 0, nextSeed: seed, logEntries: [] };
  
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
    const card = currDeck.shift()!;
    currHand.push(card);
    drawnCount++;
  }

  return { nextDeck: currDeck, nextHand: currHand, nextDiscard: currDiscard, drawnCount, reshuffles, nextSeed: currSeed, logEntries };
}

export function phaseLabel(phase: Phase) {
  switch (phase) {
    case "SELECT_ACTION":
      return "Select action";
    case "ATTACK_DECLARE":
      return "Attack declare";
    case "DEFENSE_DECLARE":
      return "Defense declare";
    case "COMBAT_RESOLUTION":
      return "Combat";
    case "END_TURN":
      return "End turn";
  }
}

export function clampLog(lines: string[]) {
  return lines.slice(0, 5); 
}

export function checkInvariants(state: GameState): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  const players: Player[] = ["YOU", "AI"];
  players.forEach(p => {
    const deck = p === "YOU" ? state.deckYou : state.deckAi;
    const hand = p === "YOU" ? state.handYou : state.handAi;
    const discard = p === "YOU" ? state.discardYou : state.discardAi;
    const committedAtk = state.committedAttackCards.filter(c => c.owner === p);
    const committedDef = state.committedDefenseCards.filter(c => c.owner === p);

    const total = deck.length + hand.length + discard.length + committedAtk.length + committedDef.length;
    if (total !== CARDS_PER_PLAYER) {
      errors.push(`${p} card count mismatch: expected ${CARDS_PER_PLAYER}, got ${total}`);
    }

    if (hand.length > HAND_LIMIT) {
      errors.push(`${p} hand limit exceeded: ${hand.length}`);
    }

    const allCards = [...deck, ...hand, ...discard, ...committedAtk, ...committedDef];
    allCards.forEach(c => {
      if (c.owner !== p) {
        errors.push(`${p} has card with wrong owner: ${c.id}`);
      }
    });
  });

  return { passed: errors.length === 0, errors };
}

/**
 * INITIAL STATE
 */
export function initGame(): GameState {
  const seed = Math.floor(Math.random() * 1000000);
  const initialDeckYou = createDeck("YOU");
  const initialDeckAi = createDeck("AI");

  const { shuffled: sDeckYou, nextSeed: s1 } = shuffle(initialDeckYou, seed);
  const { shuffled: sDeckAi, nextSeed: s2 } = shuffle(initialDeckAi, s1);

  const resYou = drawCards(sDeckYou, [], [], HAND_LIMIT, s2);
  const resAi = drawCards(sDeckAi, [], [], HAND_LIMIT, resYou.nextSeed);

  return {
    turn: 1,
    activePlayer: "YOU",
    phase: "SELECT_ACTION",
    deckYou: resYou.nextDeck,
    deckAi: resAi.nextDeck,
    handYou: resYou.nextHand,
    handAi: resAi.nextHand,
    discardYou: [],
    discardAi: [],
    committedAttackCards: [],
    committedDefenseCards: [],
    selectedAttackIds: [],
    selectedDefenseIds: [],
    hpYou: STARTING_HP,
    hpAi: STARTING_HP,
    gameStatus: "PLAYING",
    winner: null,
    reveal: null,
    combatLog: ["Game Started.", `YOU drew ${resYou.drawnCount} units.`, `AI drew ${resAi.drawnCount} units.`],
    rngSeed: resAi.nextSeed,
    metrics: {
      totalDrawsYou: resYou.drawnCount,
      totalDrawsAi: resAi.drawnCount,
      totalReshufflesYou: resYou.reshuffles,
      totalReshufflesAi: resAi.reshuffles,
    },
  };
}

/**
 * Static initial state to prevent hydration mismatch.
 * The game will be initialized on the client.
 */
export const initialState: GameState = {
  turn: 0,
  activePlayer: "YOU",
  phase: "SELECT_ACTION",
  deckYou: [],
  deckAi: [],
  handYou: [],
  handAi: [],
  discardYou: [],
  discardAi: [],
  committedAttackCards: [],
  committedDefenseCards: [],
  selectedAttackIds: [],
  selectedDefenseIds: [],
  hpYou: STARTING_HP,
  hpAi: STARTING_HP,
  gameStatus: "PLAYING",
  winner: null,
  reveal: null,
  combatLog: ["Loading..."],
  rngSeed: 0,
  metrics: {
    totalDrawsYou: 0,
    totalDrawsAi: 0,
    totalReshufflesYou: 0,
    totalReshufflesAi: 0,
  },
};
export type State = GameState;
