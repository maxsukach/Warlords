# Project: Warlords (PWA)

You are assisting with a web-based PWA card game called **Warlords**.

## Non-negotiable product facts
- Platform: **PWA (web)** built in **Next.js + TypeScript + Tailwind**
- Orientation: **Portrait mode only** (mobile-first). UI must work well on ~390x844 and scale up.
- MVP rule: **NO starting draft**. Each player starts by drawing **6 random cards**.
- UI approach: **state-driven** game screen (phase-based UI, locks/unlocks).

## Current goal (MVP)
Implement a playable core loop on a single “Core Game Screen”:
- Header (turn, active player, phase)
- Center Zone (board/combat area)
- Actions (Attack / Pass, etc.)
- Mini combat log (last 1–3 lines)
- Bottom Hand dock (scrollable)

## Engineering constraints
- Keep game rules in pure functions (domain layer), UI separate.
- Prefer `useReducer` for the initial state machine.
- Avoid over-engineering: no backend required for MVP unless requested.

## Notes
- If specs exist in /docs, prefer them over assumptions.
- Ask for clarification only if blocking; otherwise make best pragmatic choice.