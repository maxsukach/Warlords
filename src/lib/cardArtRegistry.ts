export type Faction = "cossacks" | "tatars" | "muscovy" | "poland" | "neutral";
export type UnitKey = "INFANTRY" | "ARCHER" | "CAVALRY" | "SIEGE" | "SCOUT" | "FORT" | "LEADER";

export type CardArtExt = "webp" | "png" | "jpg";

export interface CardArtSpec {
  key: string; // path under /public/cards without extension, e.g. "cossacks/infantry_basic"
  preferredExt?: CardArtExt;
  fallbacks?: CardArtExt[];
}

export const PLACEHOLDER = "/cards/_placeholder.webp";
export const PLACEHOLDER_FALLBACK = "/cards/_missing.png";

export const CARD_ART: Record<Faction, Partial<Record<UnitKey, CardArtSpec>>> = {
  cossacks: {
    INFANTRY: { key: "cossacks/infantry_basic", preferredExt: "png", fallbacks: ["webp"] },
    ARCHER: { key: "cossacks/archer_basic", preferredExt: "png", fallbacks: ["webp"] },
    CAVALRY: { key: "cossacks/cavalry_basic", preferredExt: "png", fallbacks: ["webp"] },
    SIEGE: { key: "cossacks/siege_cannon", preferredExt: "png", fallbacks: ["webp"] },
    SCOUT: { key: "cossacks/scout_basic", preferredExt: "png", fallbacks: ["webp"] },
    FORT: { key: "cossacks/fort_basic", preferredExt: "png", fallbacks: ["webp"] },
    LEADER: { key: "cossacks/leader_basic", preferredExt: "png", fallbacks: ["webp"] },
  },
  tatars: {},
  muscovy: {},
  poland: {},
  neutral: {},
};

export function listArtSpecs() {
  return CARD_ART;
}
