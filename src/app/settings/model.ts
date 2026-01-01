export type AnimationSpeed = "slow" | "normal" | "fast";
export type AiSpeed = "normal" | "fast";

export type Settings = {
  animationSpeed: AnimationSpeed;
  showCombatLog: boolean;
  aiSpeed: AiSpeed;
};

export const DEFAULT_SETTINGS: Settings = {
  animationSpeed: "normal",
  showCombatLog: true,
  aiSpeed: "normal",
};

const STORAGE_KEY = "warlords_settings_v1";

function isAnimationSpeed(value: unknown): value is AnimationSpeed {
  return value === "slow" || value === "normal" || value === "fast";
}

function isAiSpeed(value: unknown): value is AiSpeed {
  return value === "normal" || value === "fast";
}

function parseSettings(raw: unknown): Settings {
  if (typeof raw !== "object" || raw === null) return DEFAULT_SETTINGS;

  const candidate = raw as Partial<Settings>;
  return {
    animationSpeed: isAnimationSpeed(candidate.animationSpeed) ? candidate.animationSpeed : DEFAULT_SETTINGS.animationSpeed,
    showCombatLog: typeof candidate.showCombatLog === "boolean" ? candidate.showCombatLog : DEFAULT_SETTINGS.showCombatLog,
    aiSpeed: isAiSpeed(candidate.aiSpeed) ? candidate.aiSpeed : DEFAULT_SETTINGS.aiSpeed,
  };
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored);
    return parseSettings(parsed);
  } catch (err) {
    console.warn("Failed to read settings; using defaults.", err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn("Failed to save settings.", err);
  }
}
