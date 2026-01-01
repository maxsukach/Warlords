# Cards & Assets (MVP)

CardDefinition schema
- id (CardId, string)
- name (string)
- unitType (INFANTRY | ARCHER | CAVALRY | SIEGE | SCOUT)
- power (number)
- faction? (NEUTRAL for now)
- rarity? (COMMON | UNCOMMON | RARE)
- artKey? (optional override for art filename; defaults to id)

Catalog
- Source: `src/game/cards/catalog.ts`
- Access via `getCardDefinition(id)`; falls back to a neutral placeholder if unknown.

Asset convention
- Path pattern: `public/cards/<faction>/<cardId>.webp` (png/jpg also acceptable if swapped in code).
- Current faction folder: `NEUTRAL`.
- Art key defaults to `cardId`; use `artKey` to point to a different filename if needed.

Adding art
- Drop file into `public/cards/NEUTRAL/<cardId>.webp`.
- If using a different filename, set `artKey` on the card definition.
- Missing art gracefully falls back to a styled placeholder (no broken image).

UI component
- Reusable card UI: `src/components/CardView/CardView.tsx` with sizes `compact | medium | large`, selection/disabled states, and optional power badge visibility.
- Card art uses the convention above; on error it hides the image and shows the placeholder.
