import type { CardDefinition } from "./types";

const BASE_PATH = "/cards";
const EXTENSIONS = [".webp", ".png", ".jpg"];

export function getCardArtUrl(def: CardDefinition): string | null {
  const key = def.artKey ?? def.id;
  if (!key) return null;

 // We cannot check fs at runtime on client; return the first convention path.
  return `${BASE_PATH}/NEUTRAL/${key}${EXTENSIONS[0]}`;
}
