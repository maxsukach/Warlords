# Core Game Loop

This document defines the high-level flow of a single match in Warlords.

## Match Setup
1. Shuffle each player's deck.
2. Each player draws **6 random cards**.
3. Each player places:
   - Fort (if applicable by rules)
   - Leader / Commander (conceptual for MVP).
4. Randomly determine the first player.

> There is NO starting draft in MVP.

---

## Turn Structure (High Level)

Each turn belongs to exactly one player (Active Player).

1. **Turn Start**
   - Active player is set.
   - UI switches to active state for that player.

2. **Action Selection**
   - Active player chooses exactly one action:
     - **Attack**
     - **Pass**

3. **Action Resolution**
   - If **Attack**:
     - Game proceeds through attack-related phases (see phases spec).
   - If **Pass**:
     - Turn ends immediately.

4. **Turn End**
   - Cleanup if needed.
   - Control switches to the other player.
   - Turn counter increments after both players acted.

---

## Win / Lose Conditions (MVP)
- A player loses when their Fort is destroyed
  OR
- Other clearly defined loss condition (to be finalized).

---

## Design Notes
- The game is strictly **turn-based**.
- No simultaneous actions.
- No hidden parallel phases.
- The entire loop is driven by game state, not UI events.
