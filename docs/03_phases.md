# Turn Phases (State Machine)

This document defines all gameplay phases used to drive UI and logic in Warlords.

Each phase explicitly controls:
- What the player can do
- Which UI elements are active or locked
- How the game transitions to the next phase

---

## Phase List (MVP)

### 1. SELECT_ACTION
**Owner:** Active Player

**Purpose:**
- Player decides what to do this turn.

**Allowed actions:**
- Attack
- Pass

**UI rules:**
- Hand: visible, but no cards are committed yet
- Center Zone: idle
- Action buttons: enabled (Attack / Pass)

**Transitions:**
- Attack → `ATTACK_DECLARE`
- Pass → `END_TURN`

---

### 2. ATTACK_DECLARE
**Owner:** Attacking Player

**Purpose:**
- Attacker commits units to the attack.

**Allowed actions:**
- Select attacking cards from hand
- Confirm attack

**UI rules:**
- Hand: selectable
- Selected cards move to Center Zone
- Defender input is locked

**Transitions:**
- Confirm → `DEFENSE_DECLARE`

---

### 3. DEFENSE_DECLARE
**Owner:** Defending Player

**Purpose:**
- Defender reacts to the declared attack.

**Rules:**
- Defender must respond with all available applicable cards
- Defense is mandatory if cards are available

**UI rules:**
- Defender hand: active
- Attacker input: locked
- Center Zone: shows attack vs defense

**Transitions:**
- Defense resolved → `COMBAT_RESOLUTION`

---

### 4. COMBAT_RESOLUTION
**Owner:** System

**Purpose:**
- Resolve combat outcome.

**Rules:**
- Damage is calculated
- Units are destroyed or survive
- Fort damage is applied if applicable

**UI rules:**
- All player input locked
- Combat log updates
- Optional short delay / animation

**Transitions:**
- Resolution complete → `END_TURN`

---

### 5. END_TURN
**Owner:** System

**Purpose:**
- Cleanup and handover.

**Rules:**
- Clear temporary states
- Switch active player

**UI rules:**
- No input
- Board resets to idle

**Transitions:**
- Next player → `SELECT_ACTION`

---

## Design Principles
- Only ONE phase is active at any time
- UI availability is strictly phase-driven
- No hidden logic outside phase transitions
- Phase machine is deterministic and testable
