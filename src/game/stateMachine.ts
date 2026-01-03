import { HAND_LIMIT, clampLog, initGame, resetMatch } from "./gameState";
import type { Card, GameState, GameStatus, Phase, Player } from "./gameState";
import { resolveDef } from "@/lib/cards/resolve";
import { drawCards, shuffle } from "@/lib/game/deck";
import { endTurn } from "@/lib/game/turn";
import { checkMatchEnd } from "@/lib/game/endConditions";
import {
  addDefaultBuildingIfAllowed,
  applyFortDefense,
  getPowerModifier,
  setBuildingsActive,
} from "./buildings";

export type { GameState, Phase } from "./gameState";

export type GameActionType =
  | "SELECT_ATTACK"
  | "SELECT_PASS"
  | "TOGGLE_ATTACK_CARD"
  | "CONFIRM_ATTACK"
  | "TOGGLE_DEFENSE_CARD"
  | "CONFIRM_DEFENSE"
  | "RESOLVE_COMBAT"
  | "NEXT_TURN"
  | "CLOSE_REVEAL"
  | "RESET_GAME"
  | "DEBUG_DRAW_ONE"
  | "DEBUG_FORCE_END_TURN";

export type GameAction =
  | { type: "SELECT_ATTACK" }
  | { type: "SELECT_PASS" }
  | { type: "TOGGLE_ATTACK_CARD"; cardId: string }
  | { type: "CONFIRM_ATTACK" }
  | { type: "TOGGLE_DEFENSE_CARD"; cardId: string }
  | { type: "CONFIRM_DEFENSE" }
  | { type: "RESOLVE_COMBAT" }
  | { type: "NEXT_TURN" }
  | { type: "CLOSE_REVEAL" }
  | { type: "RESET_GAME" }
  | { type: "DEBUG_DRAW_ONE" }
  | { type: "DEBUG_FORCE_END_TURN" };

function appendLog(state: GameState, entry: string): GameState {
  return { ...state, combatLog: clampLog([entry, ...state.combatLog]) };
}

function invalidAction(state: GameState, action: GameActionType, reason?: string): GameState {
  const detail = reason ? ` (${reason})` : "";
  return appendLog(state, `Invalid action ${action} in ${state.phase}${detail}.`);
}

function defenderFor(attacker: Player): Player {
  return attacker === "YOU" ? "AI" : "YOU";
}

function deactivateBuildings(state: GameState): GameState {
  const target = state.activePlayer === "YOU" ? state.buildingsYou : state.buildingsAi;
  const updated = setBuildingsActive(target, false);
  return state.activePlayer === "YOU"
    ? { ...state, buildingsYou: updated }
    : { ...state, buildingsAi: updated };
}

function applyBuildPhase(state: GameState): GameState {
  const target = state.activePlayer === "YOU" ? state.buildingsYou : state.buildingsAi;
  let nextBuildings = setBuildingsActive(target, true);
  let addedLog: string[] = [];
  if (nextBuildings.length < 2) {
    const { next, added } = addDefaultBuildingIfAllowed(nextBuildings, state.activePlayer);
    nextBuildings = next;
    if (added) {
      addedLog = [`${state.activePlayer} built ${added.type} (L1).`];
    }
  }

  const withBuildings =
    state.activePlayer === "YOU"
      ? { ...state, buildingsYou: nextBuildings }
      : { ...state, buildingsAi: nextBuildings };

  const nextLog = addedLog.length > 0 ? clampLog([...addedLog, ...withBuildings.combatLog]) : withBuildings.combatLog;

  return {
    ...withBuildings,
    phase: "SELECT_ACTION",
    combatLog: nextLog,
  };
}

export function getAllowedActions(state: GameState): GameActionType[] {
  if (state.gameStatus === "GAME_OVER" || state.phase === "GAME_OVER") return [];
  if (state.reveal) return ["CLOSE_REVEAL"];

  switch (state.phase) {
    case "TURN_START":
    case "DRAW":
    case "BUILD":
      return [];
    case "SELECT_ACTION":
      return ["SELECT_ATTACK", "SELECT_PASS"];
    case "ATTACK_DECLARE":
      return ["TOGGLE_ATTACK_CARD", "CONFIRM_ATTACK"];
    case "DEFENSE_DECLARE":
      return ["TOGGLE_DEFENSE_CARD", "CONFIRM_DEFENSE"];
    case "COMBAT_RESOLUTION":
      return ["RESOLVE_COMBAT"];
    case "END_TURN":
      return ["NEXT_TURN"];
    default:
      return [];
  }
}

export function getNextPhaseCandidates(state: GameState): Phase[] {
  if (state.reveal) return ["END_TURN"];
  if (state.gameStatus === "GAME_OVER") return [state.phase];

  switch (state.phase) {
    case "TURN_START":
      return ["DRAW"];
    case "DRAW":
      return ["BUILD"];
    case "BUILD":
      return ["SELECT_ACTION"];
    case "SELECT_ACTION":
      return ["ATTACK_DECLARE", "END_TURN"];
    case "ATTACK_DECLARE":
      return ["DEFENSE_DECLARE"];
    case "DEFENSE_DECLARE":
      return ["COMBAT_RESOLUTION"];
    case "COMBAT_RESOLUTION":
      return ["END_TURN"];
    case "END_TURN":
      return ["SELECT_ACTION"];
    default:
      return [state.phase];
  }
}

export function transition(state: GameState, action: GameAction): GameState {
  if (state.gameStatus === "GAME_OVER") {
    return invalidAction(state, action.type, "game over");
  }

  if (state.phase === "GAME_OVER") {
    return invalidAction(state, action.type, "game over");
  }

  if (state.reveal && action.type !== "CLOSE_REVEAL") {
    return invalidAction(state, action.type, "reveal active");
  }

  switch (action.type) {
    case "SELECT_ATTACK": {
      if (state.phase !== "SELECT_ACTION") return invalidAction(state, action.type);
      const who = state.activePlayer === "YOU" ? "You" : "AI";
      return {
        ...state,
        phase: "ATTACK_DECLARE",
        combatLog: clampLog([`${who} preparing to strike.`, ...state.combatLog]),
      };
    }

    case "SELECT_PASS": {
      if (state.phase !== "SELECT_ACTION") return invalidAction(state, action.type);
      const who = state.activePlayer === "YOU" ? "You" : "AI";
      return {
        ...state,
        phase: "END_TURN",
        combatLog: clampLog([`${who} holds position.`, ...state.combatLog]),
      };
    }

    case "TOGGLE_ATTACK_CARD": {
      if (state.phase !== "ATTACK_DECLARE") return invalidAction(state, action.type);
      const exists = state.selectedAttackIds.includes(action.cardId);
      const next = exists
        ? state.selectedAttackIds.filter((id) => id !== action.cardId)
        : [...state.selectedAttackIds, action.cardId];
      return { ...state, selectedAttackIds: next };
    }

    case "CONFIRM_ATTACK": {
      if (state.phase !== "ATTACK_DECLARE") return invalidAction(state, action.type);
      if (state.selectedAttackIds.length === 0) return invalidAction(state, action.type, "no attackers selected");

      const attackerHand = state.activePlayer === "YOU" ? state.handYou : state.handAi;
      const committed = attackerHand.filter((c) => state.selectedAttackIds.includes(c.id));
      const remainingHand = attackerHand.filter((c) => !state.selectedAttackIds.includes(c.id));

      const isScoutAttack = committed.length === 1 && resolveDef(committed[0].cardId).unit === "SCOUT";
      if (isScoutAttack) {
        const scoutCard = committed[0];
        const defenderHand = state.activePlayer === "YOU" ? state.handAi : state.handYou;
        const catchers = defenderHand.filter((c) => {
          const unit = resolveDef(c.cardId).unit;
          return ["INFANTRY", "ARCHER", "CAVALRY", "SCOUT"].includes(unit);
        });

        const revealedCards: Card[] = [];
        let caught = false;
        const nextDiscardAttacker = [...(state.activePlayer === "YOU" ? state.discardYou : state.discardAi)];

        if (catchers.length > 0) {
          caught = true;
          revealedCards.push(catchers[0]);
          nextDiscardAttacker.push(scoutCard);

          const others = defenderHand.filter((c) => c.id !== catchers[0].id);
          const { shuffled: randoms } = shuffle(others, state.rngSeed);
          revealedCards.push(...randoms.slice(0, 2));
        } else {
          const { shuffled: randoms } = shuffle(defenderHand, state.rngSeed);
          revealedCards.push(...randoms.slice(0, 3));
        }

        const attackerName = state.activePlayer === "YOU" ? "YOU" : "AI";
        const logMsg = caught
          ? `${attackerName} Scout caught by ${resolveDef(catchers[0].cardId).name}! Revealed ${revealedCards.length} units.`
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

      const names = committed.map((c) => resolveDef(c.cardId).name).join(", ");
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
      if (state.phase !== "DEFENSE_DECLARE") return invalidAction(state, action.type);
      const exists = state.selectedDefenseIds.includes(action.cardId);
      const next = exists
        ? state.selectedDefenseIds.filter((id) => id !== action.cardId)
        : [...state.selectedDefenseIds, action.cardId];
      return { ...state, selectedDefenseIds: next };
    }

    case "CONFIRM_DEFENSE": {
      if (state.phase !== "DEFENSE_DECLARE") return invalidAction(state, action.type);

      const defenderHand = state.activePlayer === "YOU" ? state.handAi : state.handYou;
      const committed = defenderHand.filter((c) => state.selectedDefenseIds.includes(c.id));
      const remainingHand = defenderHand.filter((c) => !state.selectedDefenseIds.includes(c.id));

      const names = committed.length > 0 ? committed.map((c) => resolveDef(c.cardId).name).join(", ") : "no units";
      const defenderName = defenderFor(state.activePlayer);

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
      if (state.phase !== "COMBAT_RESOLUTION") return invalidAction(state, action.type);

      const totalAttack = state.committedAttackCards.reduce(
        (sum, c) => sum + ((resolveDef(c.cardId).power ?? 0) + getPowerModifier(c, c.owner === "YOU" ? state.buildingsYou : state.buildingsAi)),
        0
      );
      const totalDefense = state.committedDefenseCards.reduce(
        (sum, c) => sum + ((resolveDef(c.cardId).power ?? 0) + getPowerModifier(c, c.owner === "YOU" ? state.buildingsYou : state.buildingsAi)),
        0
      );

      const netDamage = Math.max(0, totalAttack - totalDefense);
      const defenderName = state.activePlayer === "YOU" ? "AI" : "You";

      let nextHpYou = state.hpYou;
      let nextHpAi = state.hpAi;

      const defenderBuildings = state.activePlayer === "YOU" ? state.buildingsAi : state.buildingsYou;
      const adjustedDamage = applyFortDefense(netDamage, defenderBuildings);

      if (state.activePlayer === "YOU") {
        nextHpAi = Math.max(0, state.hpAi - adjustedDamage);
      } else {
        nextHpYou = Math.max(0, state.hpYou - adjustedDamage);
      }

      const lines = [
        `Battle: ${totalAttack} Atk vs ${totalDefense} Def.`,
        netDamage > 0 ? `${defenderName} takes ${adjustedDamage} damage.` : "Defenders hold the line.",
        `${defenderName} HP: ${state.activePlayer === "YOU" ? nextHpAi : nextHpYou}.`,
      ];

      let nextStatus: GameStatus = state.gameStatus;
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

      const matchResult = checkMatchEnd({
        ...state,
        hpYou: nextHpYou,
        hpAi: nextHpAi,
      });
      if (matchResult && nextStatus !== "GAME_OVER") {
        nextStatus = "GAME_OVER";
      }
      if (matchResult === "YOU_WIN") nextWinner = "YOU";
      if (matchResult === "AI_WIN") nextWinner = "AI";

      const nextDiscardYou = [...state.discardYou];
      const nextDiscardAi = [...state.discardAi];

      state.committedAttackCards.forEach((c) => {
        if (c.owner === "YOU") nextDiscardYou.push(c);
        else nextDiscardAi.push(c);
      });
      state.committedDefenseCards.forEach((c) => {
        if (c.owner === "YOU") nextDiscardYou.push(c);
        else nextDiscardAi.push(c);
      });

      return {
        ...state,
        hpYou: nextHpYou,
        hpAi: nextHpAi,
        gameStatus: nextStatus,
        winner: nextWinner,
        matchResult,
        phase: nextStatus === "GAME_OVER" ? "GAME_OVER" : "END_TURN",
        discardYou: nextDiscardYou,
        discardAi: nextDiscardAi,
        committedAttackCards: [],
        committedDefenseCards: [],
        combatLog: clampLog([...lines, ...state.combatLog]),
      };
    }

    case "NEXT_TURN": {
      if (state.phase !== "END_TURN") return invalidAction(state, action.type);

      // deactivate current player's buildings
      const deactivated = deactivateBuildings(state);
      // switch turn and draw, then enter build phase for the new active player
      const base = endTurn(deactivated);
      return applyBuildPhase({ ...base, phase: "BUILD" });
    }

    case "CLOSE_REVEAL": {
      if (!state.reveal) return invalidAction(state, action.type, "nothing to close");

      const nextDiscardYou = [...state.discardYou];
      const nextDiscardAi = [...state.discardAi];
      state.committedAttackCards.forEach((c) => {
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

    case "RESET_GAME": {
      return invalidAction(state, action.type, "use reducer to reset");
    }

    case "DEBUG_DRAW_ONE": {
      const isYou = state.activePlayer === "YOU";
      const deck = isYou ? state.deckYou : state.deckAi;
      const hand = isYou ? state.handYou : state.handAi;
      const discard = isYou ? state.discardYou : state.discardAi;
      const res = drawCards(deck, hand, discard, Math.min(HAND_LIMIT, hand.length + 1), state.rngSeed);

      return {
        ...state,
        deckYou: isYou ? res.nextDeck : state.deckYou,
        handYou: isYou ? res.nextHand : state.handYou,
        discardYou: isYou ? res.nextDiscard : state.discardYou,
        deckAi: isYou ? state.deckAi : res.nextDeck,
        handAi: isYou ? state.handAi : res.nextHand,
        discardAi: isYou ? state.discardAi : res.nextDiscard,
        rngSeed: res.nextSeed,
        combatLog: clampLog([`${isYou ? "YOU" : "AI"} draws a card (debug).`, ...res.logEntries, ...state.combatLog]),
        metrics: {
          ...state.metrics,
          totalDrawsYou: state.metrics.totalDrawsYou + (isYou ? res.drawnCount : 0),
          totalDrawsAi: state.metrics.totalDrawsAi + (!isYou ? res.drawnCount : 0),
          totalReshufflesYou: state.metrics.totalReshufflesYou + (isYou ? res.reshuffles : 0),
          totalReshufflesAi: state.metrics.totalReshufflesAi + (!isYou ? res.reshuffles : 0),
        },
      };
    }

    case "DEBUG_FORCE_END_TURN": {
      // Move any committed cards to discard so nothing is lost.
      const nextDiscardYou = [...state.discardYou];
      const nextDiscardAi = [...state.discardAi];
      state.committedAttackCards.forEach((c) => (c.owner === "YOU" ? nextDiscardYou : nextDiscardAi).push(c));
      state.committedDefenseCards.forEach((c) => (c.owner === "YOU" ? nextDiscardYou : nextDiscardAi).push(c));

      const base: GameState = {
        ...state,
        phase: "END_TURN",
        committedAttackCards: [],
        committedDefenseCards: [],
        discardYou: nextDiscardYou,
        discardAi: nextDiscardAi,
        selectedAttackIds: [],
        selectedDefenseIds: [],
      };

      return endTurn(base);
    }

    default:
      return state;
  }
}

export function reducer(state: GameState, action: GameAction): GameState {
  if (action.type === "RESET_GAME") {
    const fresh = resetMatch();
    return applyBuildPhase({ ...fresh, phase: "BUILD" });
  }

  return transition(state, action);
}
