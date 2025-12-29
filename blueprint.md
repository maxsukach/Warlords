# Warlords Project Blueprint

## Overview
Warlords is a web-based PWA card game built with Next.js, TypeScript, and Tailwind CSS. It features a portrait-mode, mobile-first UI with a state-driven game screen. The game logic is handled by a pure domain layer using `useReducer` for state management.

## Project Outline
- **Platform:** PWA (web)
- **Framework:** Next.js + TypeScript + Tailwind CSS
- **Orientation:** Portrait mode only (~390x844)
- **Core Loop:**
  - Turn-based combat.
  - Players draw 6 random cards (no starting draft).
  - Phases: Select Action -> Attack/Scout Declare -> Defense Declare -> Combat Resolution -> End Turn.
- **Key Features:**
  - Unit types: Infantry, Archer, Cavalry, Siege, Scout.
  - Scout mechanic: Reveals enemy cards.
  - Fast Test Runner: Simulates 50 turns to check invariants.
  - Portrait-first responsive design.
  - Service Worker for PWA support.

## Current Change: Actionable Invariant Failures
**Goal:** Make invariant failures in the "Fast Test Runner" actionable by providing specific error messages, the step of failure, and a state snapshot.

### Plan
1.  **Add Local State in `Home` component (`src/app/page.tsx`):**
    - `testStatus`: "IDLE" | "RUNNING" | "PASS" | "FAIL"
    - `testFail`: Detailed failure object (step, message, snapshot, lastLog).
2.  **Implement Snapshot Helper (`snap`):**
    - Capture relevant state counts (deck, hand, discard, etc.) for both players.
3.  **Define Detailed Invariants (`assertInvariants`):**
    - Check for negative card counts.
    - Check hand limits.
    - Check for duplicate card IDs across all zones.
    - Check total card conservation (36 cards total).
4.  **Update `runFastTest`:**
    - Synchronously run up to 50 turns.
    - Call `assertInvariants` after every reducer step.
    - Catch errors and populate `testFail` state.
5.  **Enhance UI:**
    - Update labels to show PASS/FAIL status.
    - Add a failure detail panel with a "Copy fail JSON" button.
6.  **Refine Styles:**
    - Use compact, dark-themed UI consistent with existing design.

### Action Steps
1.  Modify `src/app/page.tsx` to add `testStatus` and `testFail` states.
2.  Define `snap` function inside `Home` or as a utility.
3.  Define `assertInvariants` function inside `Home`.
4.  Rewrite `runFastTest` logic to integrate assertions and error handling.
5.  Update the JSX to render the failure panel and "Copy" button.
