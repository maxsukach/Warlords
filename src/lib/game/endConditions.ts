import type { GameState } from "@/game/gameState";

export type MatchResult = "YOU_WIN" | "AI_WIN" | "DRAW" | null;

export function checkMatchEnd(state: GameState): MatchResult {
  const youDown = state.hpYou <= 0;
  const aiDown = state.hpAi <= 0;

  if (youDown && aiDown) return "DRAW";
  if (aiDown) return "YOU_WIN";
  if (youDown) return "AI_WIN";
  return null;
}
