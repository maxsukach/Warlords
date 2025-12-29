/** 
 * CONSTANTS 
 */
export const HAND_LIMIT = 6 as const;
export const STARTING_HP = 20 as const;
export const AI_THINK_MS = 600 as const;
export const CARDS_PER_PLAYER = 18 as const;

/**
 * TYPES
 */
export type Player = "YOU" | "AI";
export type UnitType = "INFANTRY" | "ARCHER" | "CAVALRY" | "SIEGE" | "SCOUT";

export type Phase =
  | "SELECT_ACTION"
  | "ATTACK_DECLARE"
  | "DEFENSE_DECLARE"
  | "COMBAT_RESOLUTION"
  | "END_TURN";

export type Card = {
  id: string;
  name: string;
  power: number;
  type: UnitType;
  owner: Player;
};

export type State = {
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

  gameStatus: "PLAYING" | "GAME_OVER";
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

export type Action =
  | { type: "SELECT_ATTACK" }
  | { type: "SELECT_PASS" }
  | { type: "TOGGLE_ATTACK_CARD"; cardId: string }
  | { type: "CONFIRM_ATTACK" }
  | { type: "TOGGLE_DEFENSE_CARD"; cardId: string }
  | { type: "CONFIRM_DEFENSE" }
  | { type: "RESOLVE_COMBAT" }
  | { type: "NEXT_TURN" }
  | { type: "RESET_GAME" }
  | { type: "CLOSE_REVEAL" };

/**
 * UTILS
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return { val: x - Math.floor(x), nextSeed: seed };
}

function shuffle<T>(array: T[], seed: number): { shuffled: T[]; nextSeed: number } {
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
  const deck: Card[] = [];
  const catalog: { type: UnitType; name: string; power: number; count: number; prefix: string }[] = [
    { type: "INFANTRY", name: "Infantry", power: 2, count: 6, prefix: "inf" },
    { type: "ARCHER", name: "Archer", power: 2, count: 4, prefix: "arc" },
    { type: "CAVALRY", name: "Cavalry", power: 3, count: 4, prefix: "cav" },
    { type: "SIEGE", name: "Siege Engine", power: 4, count: 2, prefix: "sie" },
    { type: "SCOUT", name: "Scout", power: 1, count: 2, prefix: "sco" },
  ];

  catalog.forEach((item) => {
    for (let i = 1; i <= item.count; i++) {
      deck.push({
        id: `${owner}-${item.prefix}-${i.toString().padStart(2, '0')}`,
        name: item.name,
        power: item.power,
        type: item.type,
        owner: owner,
      });
    }
  });
  return deck;
}

function drawCards(deck: Card[], hand: Card[], discard: Card[], limit: number, seed: number): { 
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
  let currHand = [...hand];
  let currSeed = seed;
  let drawnCount = 0;
  let reshuffles = 0;
  let logEntries: string[] = [];

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

function clampLog(lines: string[]) {
  return lines.slice(0, 5); 
}

export function checkInvariants(state: State): { passed: boolean; errors: string[] } {
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
export function initGame(): State {
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
export const initialState: State = {
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

/**
 * REDUCER
 */
export function reducer(state: State, action: Action): State {
  if (action.type === "RESET_GAME") {
    return initGame();
  }

  if (state.gameStatus === "GAME_OVER") {
    return state;
  }

  switch (action.type) {
    case "CLOSE_REVEAL": {
      if (!state.reveal) return state;
      
      const nextDiscardYou = [...state.discardYou];
      const nextDiscardAi = [...state.discardAi];
      state.committedAttackCards.forEach(c => {
          if (c.owner === "YOU") nextDiscardYou.push(c);
          else nextDiscardAi.push(c);
      });

      return {
        ...state,
        phase: "END_TURN",
        reveal: null,
        committedAttackCards: [],
        discardYou: nextDiscardYou,
        discardAi: nextDiscardAi,
      };
    }

    case "SELECT_ATTACK": {
      if (state.phase !== "SELECT_ACTION") return state;
      const who = state.activePlayer === "YOU" ? "You" : "AI";
      return {
        ...state,
        phase: "ATTACK_DECLARE",
        combatLog: clampLog([`${who} preparing to strike.`, ...state.combatLog]),
      };
    }

    case "SELECT_PASS": {
      if (state.phase !== "SELECT_ACTION") return state;
      const who = state.activePlayer === "YOU" ? "You" : "AI";
      return {
        ...state,
        phase: "END_TURN",
        combatLog: clampLog([`${who} holds position.`, ...state.combatLog]),
      };
    }

    case "TOGGLE_ATTACK_CARD": {
      if (state.phase !== "ATTACK_DECLARE") return state;
      const exists = state.selectedAttackIds.includes(action.cardId);
      const next = exists
        ? state.selectedAttackIds.filter((id) => id !== action.cardId)
        : [...state.selectedAttackIds, action.cardId];
      return { ...state, selectedAttackIds: next };
    }

    case "CONFIRM_ATTACK": {
      if (state.phase !== "ATTACK_DECLARE") return state;
      if (state.selectedAttackIds.length === 0) return state;

      const attackerHand = state.activePlayer === "YOU" ? state.handYou : state.handAi;
      const committed = attackerHand.filter(c => state.selectedAttackIds.includes(c.id));
      const remainingHand = attackerHand.filter(c => !state.selectedAttackIds.includes(c.id));

      const isScoutAttack = committed.length === 1 && committed[0].type === "SCOUT";
      if (isScoutAttack) {
          const scoutCard = committed[0];
          const defenderHand = state.activePlayer === "YOU" ? state.handAi : state.handYou;
          const catchers = defenderHand.filter(c => ["INFANTRY", "ARCHER", "CAVALRY", "SCOUT"].includes(c.type));
          
          let revealedCards: Card[] = [];
          let caught = false;
          let nextDiscardAttacker = [...(state.activePlayer === "YOU" ? state.discardYou : state.discardAi)];

          if (catchers.length > 0) {
            caught = true;
            revealedCards.push(catchers[0]);
            nextDiscardAttacker.push(scoutCard);
            
            const others = defenderHand.filter(c => c.id !== catchers[0].id);
            const { shuffled: randoms } = shuffle(others, state.rngSeed);
            revealedCards.push(...randoms.slice(0, 2));
          } else {
            const { shuffled: randoms } = shuffle(defenderHand, state.rngSeed);
            revealedCards.push(...randoms.slice(0, 3));
          }

          const attackerName = state.activePlayer === "YOU" ? "YOU" : "AI";
          const logMsg = caught 
            ? `${attackerName} Scout caught by ${catchers[0].name}! Revealed ${revealedCards.length} units.`
            : `${attackerName} Scout succeeded! Revealed ${revealedCards.length} units.`;

          return {
              ...state,
              handYou: state.activePlayer === "YOU" ? remainingHand : state.handYou,
              handAi: state.activePlayer === "AI" ? remainingHand : state.handAi,
              discardYou: state.activePlayer === "YOU" && caught ? nextDiscardAttacker : state.discardYou,
              discardAi: state.activePlayer === "AI" && caught ? nextDiscardAttacker : state.discardAi,
              committedAttackCards: caught ? [] : committed, 
              selectedAttackIds: [],
              reveal: {
                  visible: true,
                  title: caught ? "Scout Caught!" : "Scout Report",
                  cards: revealedCards,
              },
              combatLog: clampLog([logMsg, ...state.combatLog]),
          };
      }

      const names = committed.map(c => c.name).join(", ");
      const attackerName = state.activePlayer === "YOU" ? "YOU" : "AI";

      return {
        ...state,
        phase: "DEFENSE_DECLARE",
        handYou: state.activePlayer === "YOU" ? remainingHand : state.handYou,
        handAi: state.activePlayer === "AI" ? remainingHand : state.handAi,
        committedAttackCards: committed,
        selectedAttackIds: [],
        combatLog: clampLog([`${attackerName} attacks with: ${names}`, ...state.combatLog]),
      };
    }

    case "TOGGLE_DEFENSE_CARD": {
      if (state.phase !== "DEFENSE_DECLARE") return state;
      const exists = state.selectedDefenseIds.includes(action.cardId);
      const next = exists
        ? state.selectedDefenseIds.filter((id) => id !== action.cardId)
        : [...state.selectedDefenseIds, action.cardId];
      return { ...state, selectedDefenseIds: next };
    }

    case "CONFIRM_DEFENSE": {
      if (state.phase !== "DEFENSE_DECLARE") return state;

      const defenderHand = state.activePlayer === "YOU" ? state.handAi : state.handYou;
      const committed = defenderHand.filter(c => state.selectedDefenseIds.includes(c.id));
      const remainingHand = defenderHand.filter(c => !state.selectedDefenseIds.includes(c.id));

      const names = committed.length > 0 ? committed.map(c => c.name).join(", ") : "no units";
      const defenderName = state.activePlayer === "YOU" ? "AI" : "YOU";

      return {
        ...state,
        phase: "COMBAT_RESOLUTION",
        handYou: state.activePlayer === "YOU" ? state.handYou : remainingHand,
        handAi: state.activePlayer === "AI" ? state.handAi : remainingHand,
        committedDefenseCards: committed,
        selectedDefenseIds: [],
        combatLog: clampLog([`${defenderName} defends with: ${names}`, ...state.combatLog]),
      };
    }

    case "RESOLVE_COMBAT": {
      if (state.phase !== "COMBAT_RESOLUTION") return state;

      const totalAttack = state.committedAttackCards.reduce((sum, c) => sum + c.power, 0);
      const totalDefense = state.committedDefenseCards.reduce((sum, c) => sum + c.power, 0);

      const netDamage = Math.max(0, totalAttack - totalDefense);
      const defenderName = state.activePlayer === "YOU" ? "AI" : "You";

      let nextHpYou = state.hpYou;
      let nextHpAi = state.hpAi;

      if (state.activePlayer === "YOU") {
        nextHpAi = Math.max(0, state.hpAi - netDamage);
      } else {
        nextHpYou = Math.max(0, state.hpYou - netDamage);
      }

      const lines = [
        `Battle: ${totalAttack} Atk vs ${totalDefense} Def.`,
        netDamage > 0 ? `${defenderName} takes ${netDamage} damage.` : "Defenders hold the line.",
        `${defenderName} HP: ${state.activePlayer === "YOU" ? nextHpAi : nextHpYou}.`,
      ];

      let nextStatus = state.gameStatus;
      let nextWinner = state.winner;

      if (nextHpYou <= 0) {
        nextStatus = "GAME_OVER";
        nextWinner = "AI";
        lines.unshift("War is over — AI wins.");
      } else if (nextHpAi <= 0) {
        nextStatus = "GAME_OVER";
        nextWinner = "YOU";
        lines.unshift("War is over — YOU win.");
      }

      const nextDiscardYou = [...state.discardYou];
      const nextDiscardAi = [...state.discardAi];
      
      state.committedAttackCards.forEach(c => {
        if (c.owner === "YOU") nextDiscardYou.push(c);
        else nextDiscardAi.push(c);
      });
      state.committedDefenseCards.forEach(c => {
        if (c.owner === "YOU") nextDiscardYou.push(c);
        else nextDiscardAi.push(c);
      });

      return {
        ...state,
        phase: "END_TURN",
        hpYou: nextHpYou,
        hpAi: nextHpAi,
        gameStatus: nextStatus,
        winner: nextWinner,
        discardYou: nextDiscardYou,
        discardAi: nextDiscardAi,
        committedAttackCards: [],
        committedDefenseCards: [],
        combatLog: clampLog([...lines, ...state.combatLog]),
      };
    }

    case "NEXT_TURN": {
      if (state.phase !== "END_TURN") return state;

      const nextPlayer: Player = state.activePlayer === "YOU" ? "AI" : "YOU";
      const nextTurn = nextPlayer === "YOU" ? state.turn + 1 : state.turn;

      let dYou = state.deckYou;
      let hYou = state.handYou;
      let disYou = state.discardYou;
      let dAi = state.deckAi;
      let hAi = state.handAi;
      let disAi = state.discardAi;
      let seed = state.rngSeed;
      let logEntries: string[] = [];

      let addedDrawsYou = 0;
      let addedReshufflesYou = 0;
      let addedDrawsAi = 0;
      let addedReshufflesAi = 0;

      if (nextPlayer === "YOU") {
        const res = drawCards(dYou, hYou, disYou, HAND_LIMIT, seed);
        dYou = res.nextDeck;
        hYou = res.nextHand;
        disYou = res.nextDiscard;
        seed = res.nextSeed;
        addedDrawsYou = res.drawnCount;
        addedReshufflesYou = res.reshuffles;
        if (res.drawnCount > 0) logEntries.push(`YOU reinforcements: ${res.drawnCount}.`);
        logEntries.push(...res.logEntries);
      } else {
        const res = drawCards(dAi, hAi, disAi, HAND_LIMIT, seed);
        dAi = res.nextDeck;
        hAi = res.nextHand;
        disAi = res.nextDiscard;
        seed = res.nextSeed;
        addedDrawsAi = res.drawnCount;
        addedReshufflesAi = res.reshuffles;
        if (res.drawnCount > 0) logEntries.push(`AI reinforcements: ${res.drawnCount}.`);
        logEntries.push(...res.logEntries);
      }

      return {
        ...state,
        turn: nextTurn,
        activePlayer: nextPlayer,
        phase: "SELECT_ACTION",
        deckYou: dYou,
        handYou: hYou,
        discardYou: disYou,
        deckAi: dAi,
        handAi: hAi,
        discardAi: disAi,
        rngSeed: seed,
        selectedAttackIds: [],
        selectedDefenseIds: [],
        combatLog: clampLog([...logEntries, ...state.combatLog]),
        metrics: {
          totalDrawsYou: state.metrics.totalDrawsYou + addedDrawsYou,
          totalDrawsAi: state.metrics.totalDrawsAi + addedDrawsAi,
          totalReshufflesYou: state.metrics.totalReshufflesYou + addedReshufflesYou,
          totalReshufflesAi: state.metrics.totalReshufflesAi + addedReshufflesAi,
        }
      };
    }

    default:
      return state;
  }
}
