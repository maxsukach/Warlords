import type { GameState, Phase, Player } from "@/game/gameState";
import { drawCards } from "./deck";
import { HAND_LIMIT, clampLog } from "@/game/gameState";

export const TURN_PHASES = [
  "TURN_START",
  "DRAW",
  "SELECT_ACTION",
  "ATTACK_DECLARE",
  "DEFENSE_DECLARE",
  "COMBAT_RESOLUTION",
  "END_TURN",
] as const;

export type TurnPhase = (typeof TURN_PHASES)[number];

export function advancePhase(current: Phase | TurnPhase): TurnPhase {
  switch (current) {
    case "TURN_START":
      return "DRAW";
    case "DRAW":
      return "SELECT_ACTION";
    case "SELECT_ACTION":
      return "ATTACK_DECLARE";
    case "ATTACK_DECLARE":
      return "DEFENSE_DECLARE";
    case "DEFENSE_DECLARE":
      return "COMBAT_RESOLUTION";
    case "COMBAT_RESOLUTION":
      return "END_TURN";
    case "END_TURN":
    default:
      return "TURN_START";
  }
}

function defenderFor(attacker: Player): Player {
  return attacker === "YOU" ? "AI" : "YOU";
}

export function endTurn(state: GameState): GameState {
  const nextPlayer: Player = defenderFor(state.activePlayer);
  const nextTurn = nextPlayer === "YOU" ? state.turn + 1 : state.turn;

  let dYou = state.deckYou;
  let hYou = state.handYou;
  let disYou = state.discardYou;
  let dAi = state.deckAi;
  let hAi = state.handAi;
  let disAi = state.discardAi;
  let seed = state.rngSeed;
  const logEntries: string[] = [];

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
    },
  };
}
