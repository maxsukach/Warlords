# Screens & Routes (MVP)

- `/` — Start screen. CTA to start game, link to settings, optional continue (only shown when a saved game exists in localStorage).
- `/game` — Core game screen (portrait, single-screen layout). Uses state machine-driven UI, with top bar links to Home, Settings, and Reset. Gameplay and UI locks follow `docs/00_rule_lock.md`.
- `/settings` — Settings screen. Toggles: animation speed (Slow/Normal/Fast), combat log visibility (On/Off), AI speed (Normal/Fast). Changes persist to localStorage and only affect UX pacing/visibility (not rules).

Navigation:
- Start → Game and Start → Settings via CTA buttons.
- Game top bar: Home, Settings, Reset.
- Settings footer: Back to Start and quick link to Game.
