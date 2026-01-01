# Rule Lock Contract

## Immutable Rules (MUST NOT CHANGE)
- Core loop: Each turn belongs to one active player; they MUST choose exactly one action (Attack or Pass). Pass ends the turn immediately; Attack proceeds through the defined attack phases. Turn ends with cleanup and player swap; game is strictly turn-based with no simultaneous actions.
- Phase order is fixed: SELECT_ACTION → ATTACK_DECLARE → DEFENSE_DECLARE → COMBAT_RESOLUTION → END_TURN → back to SELECT_ACTION. Only one phase is active at a time.
- Phase meanings and constraints:
  - SELECT_ACTION: Active player decides Attack or Pass; hand visible but uncommitted; actions enabled.
  - ATTACK_DECLARE: Attacker selects attackers from hand, commits them to Center Zone; defender input locked.
  - DEFENSE_DECLARE: Defender MUST respond with available applicable cards; defender hand active; attacker locked.
  - COMBAT_RESOLUTION: System resolves outcomes (damage, unit survival, Fort damage if applicable); all input locked.
  - END_TURN: System cleanup, clear temporary states, switch active player; no player input.
- Action constraints per phase are phase-driven; UI availability MUST follow the phase rules above.
- UI layout invariants (portrait single-screen): Sticky Header (title, turn number, active player, phase), large Center Zone (opponent area, combat middle, player committed area), persistent Actions Bar with phase-appropriate buttons, always-visible mini Combat Log (last 1–3 lines), sticky bottom Hand Dock (horizontal scroll, thumb-reachable, shows locked state when not the player’s phase). Layout MUST remain stable without jumping between phases.
- Platform/UI requirement: Web PWA in portrait mode only; mobile-first, touch targets ~44px with safe-area padding respected.

## Allowed Changes (SAFE TO CHANGE)
- Visual styling, theming, and animations that do not alter behavior or layout invariants.
- Internal refactors of components/services that preserve documented behavior and phase logic.
- Performance optimizations (memoization, batching, lazy loading) that keep behavior unchanged.
- Logging, telemetry, and analytics toggles or instrumentation that do not affect gameplay flow.

## Change Protocol
- Any proposed change to these rules MUST update the relevant `/docs` source files first.
- After docs are updated, code MUST be aligned to match the new documentation.
- Every rule change MUST add a short entry to `docs/CHANGELOG.md` describing the change and date.
