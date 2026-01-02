import { getCardArtUrl, type Faction as ArtFaction } from "@/lib/contract";
import type { CardDefinition } from "./catalog";

export function getArtUrl(def: CardDefinition): string {
  if (def.art?.keyOverride) {
    const key = def.art.keyOverride;
    // keyOverride is already a path under /cards/ without extension
    const [factionGuess] = key.split("/");
    return getCardArtUrl(factionGuess as ArtFaction, def.unit);
  }
  return getCardArtUrl(def.art.faction, def.art.unit);
}
