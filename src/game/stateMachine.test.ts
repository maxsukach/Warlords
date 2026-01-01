import { describe, expect, it } from "vitest";

import { HAND_LIMIT, STARTING_HP, type GameState, type Card } from "./gameState";
import { getAllowedActions, transition } from "./stateMachine";

function createCard(owner: "YOU" | "AI", idSuffix: string, power = 2, type: Card["type"] = "INFANTRY"): Card {
  return {
    id: `${owner}-${idSuffix}`,
    name: `${type}-${idSuffix}`,
    power,
    type,
    owner,
  };
}

function baseState(overrides: Partial<GameState> = {}): GameState {
  return {
    turn: 1,
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
    combatLog: [],
    rngSeed: 1,
    metrics: {
      totalDrawsYou: 0,
      totalDrawsAi: 0,
      totalReshufflesYou: 0,
      totalReshufflesAi: 0,
    },
    ...overrides,
  };
}

describe("stateMachine", () => {
  it("phase order is enforced", () => {
    const state = baseState();
    const next = transition(state, { type: "NEXT_TURN" });

    expect(next.phase).toBe("SELECT_ACTION");
    expect(next.combatLog[0]).toContain("Invalid action NEXT_TURN");
    expect(getAllowedActions(next)).toEqual(["SELECT_ATTACK", "SELECT_PASS"]);
  });

  it("invalid action is logged and state unchanged", () => {
    const attackCard = createCard("YOU", "a1");
    const state = baseState({ phase: "ATTACK_DECLARE", handYou: [attackCard] });

    const next = transition(state, { type: "CONFIRM_ATTACK" });

    expect(next.phase).toBe("ATTACK_DECLARE");
    expect(next.handYou).toHaveLength(1);
    expect(next.combatLog[0]).toContain("Invalid action CONFIRM_ATTACK");
  });

  it("attack flow transitions across phases correctly", () => {
    const attackCard = createCard("YOU", "a1", 3, "INFANTRY");
    const defenseCard = createCard("AI", "d1", 1, "INFANTRY");

    let state = baseState({
      handYou: [attackCard],
      handAi: [defenseCard],
      deckYou: Array.from({ length: HAND_LIMIT }, (_, i) => createCard("YOU", `d${i}`)),
      deckAi: Array.from({ length: HAND_LIMIT }, (_, i) => createCard("AI", `d${i}`)),
    });

    state = transition(state, { type: "SELECT_ATTACK" });
    expect(state.phase).toBe("ATTACK_DECLARE");

    state = transition(state, { type: "TOGGLE_ATTACK_CARD", cardId: attackCard.id });
    state = transition(state, { type: "CONFIRM_ATTACK" });
    expect(state.phase).toBe("DEFENSE_DECLARE");
    expect(state.committedAttackCards).toHaveLength(1);
    expect(state.handYou).toHaveLength(0);

    state = transition(state, { type: "TOGGLE_DEFENSE_CARD", cardId: defenseCard.id });
    state = transition(state, { type: "CONFIRM_DEFENSE" });
    expect(state.phase).toBe("COMBAT_RESOLUTION");

    state = transition(state, { type: "RESOLVE_COMBAT" });
    expect(state.phase).toBe("END_TURN");
    expect(state.hpAi).toBe(STARTING_HP - Math.max(0, attackCard.power - defenseCard.power));

    state = transition(state, { type: "NEXT_TURN" });
    expect(state.phase).toBe("SELECT_ACTION");
    expect(state.activePlayer).toBe("AI");
  });
});
