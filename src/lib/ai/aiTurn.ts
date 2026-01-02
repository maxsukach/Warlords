import type { GameState } from "@/game/gameState";
import type { CardId } from "@/lib/cards/catalog";
import { resolveDef } from "@/lib/cards/resolve";

export type AiPlan = {
  action: "ATTACK" | "DEFEND" | "PASS";
  cardIdToPlay?: string;
  target?: "FORT" | "UNIT";
  notes?: string;
};

type Scored = { cardId: CardId; score: number; notes: string };

function scoreCard(cardId: CardId, state: GameState): Scored {
  const def = resolveDef(cardId);
  const power = def.power ?? 0;
  const vsFortBonus = def.unit === "SIEGE" ? 1.5 : 1;
  const hpLeft = state.hpYou;
  const lethalBonus = power >= hpLeft ? 5 : 0;
  const base = power;
  const score = base * vsFortBonus + lethalBonus;
  return { cardId, score, notes: `pow:${power} fortBonus:${vsFortBonus} lethal:${lethalBonus}` };
}

export function decideAiAction(state: GameState): AiPlan {
  // If no cards or game over -> pass
  if (state.handAi.length === 0 || state.gameStatus === "GAME_OVER") {
    return { action: "PASS", notes: "No cards or game over" };
  }

  // Score all cards in AI hand
  const scored = state.handAi.map((c) => scoreCard(c.cardId, state)).sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (!best || best.score <= 0) {
    return { action: "PASS", notes: "No positive score" };
  }

  // If can deal lethal, attack
  const bestDef = resolveDef(best.cardId);
  const power = bestDef.power ?? 0;
  if (power >= state.hpYou) {
    return {
      action: "ATTACK",
      cardIdToPlay: state.handAi.find((c) => c.cardId === best.cardId)?.id,
      target: "FORT",
      notes: "Lethal attempt",
    };
  }

  // Otherwise attack with best value
  return {
    action: "ATTACK",
    cardIdToPlay: state.handAi.find((c) => c.cardId === best.cardId)?.id,
    target: "FORT",
    notes: best.notes,
  };
}

export function applyAiPlan(state: GameState, plan: AiPlan): AiPlan {
  // For now plan is returned as-is; placeholder for future stateful transforms.
  return plan;
}

export function runAiTurn(state: GameState): AiPlan {
  const plan = decideAiAction(state);
  return applyAiPlan(state, plan);
}
