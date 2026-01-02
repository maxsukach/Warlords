import {
  CARD_ART,
  PLACEHOLDER,
  PLACEHOLDER_FALLBACK,
  type CardArtExt,
  type Faction,
  type UnitKey,
} from "./cardArtRegistry";

const DEFAULT_EXTS: CardArtExt[] = ["webp", "png", "jpg"];

function unique<T>(items: T[]): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  items.forEach((item) => {
    if (item && !seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  });
  return result;
}

function buildCandidates(key: string, preferredExt?: CardArtExt, fallbacks?: CardArtExt[]) {
  const extOrder = unique([preferredExt ?? "webp", ...(fallbacks ?? []), ...DEFAULT_EXTS]);
  return extOrder.map((ext) => `/cards/${key}.${ext}`);
}

export function getCardArtCandidates(faction: Faction, unit: UnitKey): string[] {
  const spec = CARD_ART[faction]?.[unit];
  const key = spec?.key?.trim();
  if (!key) {
    return unique([PLACEHOLDER, PLACEHOLDER_FALLBACK]);
  }

  const candidates = buildCandidates(key, spec?.preferredExt, spec?.fallbacks);
  candidates.push(PLACEHOLDER);
  candidates.push(PLACEHOLDER_FALLBACK);
  return unique(candidates);
}

export function getCardArtUrl(faction: Faction, unit: UnitKey): string {
  const [first] = getCardArtCandidates(faction, unit);
  return first || PLACEHOLDER;
}

export type { Faction, UnitKey };
export { PLACEHOLDER as PLACEHOLDER_ART };
