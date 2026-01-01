# Card Contract (Source of Truth)

- Types live in `src/domain/cards/contract.ts` and registry in `src/domain/cards/registry.ts`.
- CardDefinition fields: `id`, `faction`, `unitType`, `rarity`, `name`, optional `power`, `tags`, and `art` with `basePath` + `preferredExt`.
- Art URL convention: `/cards/<faction-lower>/<slug>.png|webp` built via `getCardArtUrl`.
- Registry: add entries to `CARD_REGISTRY`; ids must be unique. Current seed covers the COSSACKS basic set.
- Adding a new card/faction:
  1) Drop asset: `public/cards/<faction>/<slug>.png` (or webp).
  2) Add CardDefinition to `CARD_REGISTRY` with matching `art.basePath`.
  3) Gallery and UI pick it up automatically; tests enforce unique ids and art path helpers.
