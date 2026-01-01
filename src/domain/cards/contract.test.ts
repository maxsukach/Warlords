import { describe, expect, it } from "vitest";
import { CARD_REGISTRY, getCardArtUrl, getCardById, makeCardId } from "./index";

describe("card contract", () => {
  it("makeCardId builds expected slug", () => {
    const id = makeCardId({ faction: "COSSACKS", unitType: "INFANTRY", rarity: "BASIC" });
    expect(id).toBe("cossacks_infantry_basic");
  });

  it("getCardArtUrl builds expected path", () => {
    const card = getCardById("cossacks_infantry_basic");
    expect(getCardArtUrl(card.art, { preferredExt: "png", faction: card.faction })).toBe("/cards/cossacks/infantry_basic.png");
    expect(getCardArtUrl(card.art, { faction: card.faction })).toBe("/cards/cossacks/infantry_basic.png");
  });

  it("getCardArtUrl handles missing card safely", () => {
    expect(getCardArtUrl(undefined)).toBe("/cards/_missing.png");
    expect(getCardArtUrl(null)).toBe("/cards/_missing.png");
    expect(getCardArtUrl({ fileBase: "x/y", preferredExt: "png", faction: "cossacks" }, { preferredExt: "png" })).toBe("/cards/cossacks/x/y.png");
  });

  it("registry contains unique ids", () => {
    const ids = CARD_REGISTRY.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("getCardById throws on unknown id", () => {
    expect(() => getCardById("missing_card")).toThrow();
  });
});
