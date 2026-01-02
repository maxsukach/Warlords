import { describe, expect, it } from "vitest";
import { CARD_REGISTRY, getCardArtUrl, getCardArtCandidates, getCardDef, makeCardId, PLACEHOLDER_ART } from "./index";

describe("card contract", () => {
  it("makeCardId builds expected slug", () => {
    const id = makeCardId({ faction: "COSSACKS", unitType: "INFANTRY", rarity: "BASIC" });
    expect(id).toBe("cossacks_infantry_basic");
  });

  it("getCardArtUrl builds expected path", () => {
    const card = getCardDef("cossacks_infantry_basic");
    expect(getCardArtUrl(card.id)).toBe("/cards/cossacks/infantry_basic.png");
  });

  it("getCardArtUrl handles missing card safely", () => {
    const url = getCardArtUrl("missing_card");
    expect(url).toBe(PLACEHOLDER_ART);
    expect(getCardArtCandidates("missing_card")[0]).toBe(PLACEHOLDER_ART);
  });

  it("registry contains unique ids", () => {
    const ids = Object.keys(CARD_REGISTRY);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("getCardDef throws on unknown id", () => {
    expect(() => getCardDef("missing_card")).toThrow();
  });
});
