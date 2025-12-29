# Core Game Screen — Portrait UI Layout

This document defines the single-screen UI layout for Warlords MVP in **Portrait Mode**.

The UI must be:
- mobile-first (thumb-friendly)
- phase-driven (locks/unlocks based on `docs/03_phases.md`)
- readable and stable (no layout jumping between phases)

---

## Screen Regions (Top → Bottom)

### A) HEADER (sticky top)
**Content:**
- Game title (Warlords)
- Turn number
- Active player (YOU / AI)
- Current phase label

**Behavior:**
- Always visible
- Never changes height

---

### B) CENTER ZONE (main arena)
**Purpose:**
- Visual battlefield / committed cards
- Shows attack vs defense during combat-related phases
- Shows idle state during SELECT_ACTION

**Behavior:**
- Takes the largest vertical space
- Contains:
  - Opponent area (top subsection)
  - Combat / middle area (center subsection)
  - Player committed area (bottom subsection)
- Shows phase-specific messaging (no heavy text blocks)

---

### C) ACTIONS BAR (context buttons)
**Purpose:**
- Primary actions for the current phase

**MVP buttons:**
- In `SELECT_ACTION`: Attack / Pass
- In `ATTACK_DECLARE`: Confirm / Cancel (and optional “Remove selection”)
- In `DEFENSE_DECLARE`: Confirm defense (if needed)
- In `END_TURN`: no buttons

**Behavior:**
- Buttons appear/enable based on phase
- Keep placement consistent (avoid reflow)

---

### D) COMBAT LOG (mini)
**Purpose:**
- Show the last 1–3 log lines

**Behavior:**
- Always visible (small)
- Updates on:
  - Attack declare
  - Defense declare
  - Combat resolution

---

### E) HAND DOCK (sticky bottom)
**Purpose:**
- Player hand (scrollable horizontal row)

**Behavior:**
- Sticky bottom
- Horizontal scroll
- Cards are tappable/selectable only when allowed by phase
- Shows “Locked” state during opponent/system phases

---

## Phase → UI Lock Rules (MVP)

### SELECT_ACTION
- Actions: enabled (Attack / Pass)
- Hand: visible, not committed
- Center Zone: idle

### ATTACK_DECLARE (attacker)
- Hand: selectable (attacker only)
- Center Zone: shows selected attackers
- Actions: Confirm / Cancel
- Opponent input: locked

### DEFENSE_DECLARE (defender)
- Defender hand: selectable (defender only)
- Center Zone: shows attackers + defenders
- Attacker input: locked

### COMBAT_RESOLUTION
- All input locked
- Center Zone: resolution state (animation optional)
- Log updates

### END_TURN
- All input locked briefly
- Transition to next active player, then SELECT_ACTION

---

## Mobile UX Notes
- Bottom Hand Dock must remain reachable by thumb.
- Avoid tiny tap targets: minimum ~44px touch targets.
- Use safe-area padding for notch/home indicator devices.
