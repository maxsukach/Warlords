# State Machine (MVP)

Phases (single active at a time):
- SELECT_ACTION — active player chooses Attack or Pass.
- ATTACK_DECLARE — attacker selects and commits attackers.
- DEFENSE_DECLARE — defender must commit applicable defenders.
- COMBAT_RESOLUTION — system resolves combat outcome.
- END_TURN — cleanup, swap active player, then return to SELECT_ACTION.

Actions:
- SELECT_ATTACK, SELECT_PASS
- TOGGLE_ATTACK_CARD, CONFIRM_ATTACK
- TOGGLE_DEFENSE_CARD, CONFIRM_DEFENSE
- RESOLVE_COMBAT
- NEXT_TURN
- CLOSE_REVEAL (used only when a Scout reveal is showing)
- RESET_GAME (handled by wrapper reducer, not the pure transition graph)

Transition table (by phase):
- SELECT_ACTION → SELECT_ATTACK → ATTACK_DECLARE; SELECT_PASS → END_TURN.
- ATTACK_DECLARE → CONFIRM_ATTACK → DEFENSE_DECLARE (or Scout reveal flow); TOGGLE_ATTACK_CARD stays in ATTACK_DECLARE.
- DEFENSE_DECLARE → CONFIRM_DEFENSE → COMBAT_RESOLUTION; TOGGLE_DEFENSE_CARD stays in DEFENSE_DECLARE.
- COMBAT_RESOLUTION → RESOLVE_COMBAT → END_TURN.
- END_TURN → NEXT_TURN → SELECT_ACTION (active player flips; turn increments when YOU becomes active).
- Reveal gate: when reveal modal is active, only CLOSE_REVEAL is accepted; CLOSE_REVEAL → END_TURN.

Invariants:
- Phase order above is deterministic; no skips except the Pass branch to END_TURN.
- Invalid actions MUST NOT change state; they append a combat log note explaining the invalid attempt.
- UI availability is phase-driven per `docs/04_ui_layout.md` and `docs/00_rule_lock.md`.
- Portrait, single-screen PWA layout MUST remain stable; phase transitions must not reflow core regions.
- Game over locks further transitions (except RESET_GAME via wrapper reducer).
