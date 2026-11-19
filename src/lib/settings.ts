import fs from "fs";
import path from "path";

export interface ApiSettings {
  geminiApiKey?: string;
  falApiKey?: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

export function readSavedApiSettings(): ApiSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return {};
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return JSON.parse(raw) as ApiSettings;
  } catch {
    return {};
  }
}

export function saveApiSettings(next: ApiSettings): ApiSettings {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const current = readSavedApiSettings();
  const merged: ApiSettings = {
    geminiApiKey:
      next.geminiApiKey !== undefined
        ? next.geminiApiKey.trim() || undefined
        : current.geminiApiKey,
    falApiKey:
      next.falApiKey !== undefined
        ? next.falApiKey.trim() || undefined
        : current.falApiKey,
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}

export function getEffectiveApiKeys(): { geminiKey?: string; falKey?: string } {
  const saved = readSavedApiSettings();
  return {
    geminiKey: saved.geminiApiKey || process.env.GEMINI_API_KEY || undefined,
    falKey: saved.falApiKey || process.env.FAL_KEY || undefined,
  };
}
