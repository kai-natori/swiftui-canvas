import type { Doc } from "./model";
import { validateDoc } from "./validate";

/* Autosave helpers over an injected key-value storage, so the core stays
 * DOM-free and testable: the web app passes `localStorage`, tests pass a
 * Map-backed fake.
 */

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const STORAGE_KEY = "swiftui-canvas:doc:v1";

export function saveDoc(storage: KeyValueStorage, doc: Doc, key: string = STORAGE_KEY): void {
  storage.setItem(key, JSON.stringify(doc));
}

export interface LoadedDoc {
  doc: Doc;
  warnings: string[];
}

export function loadDoc(storage: KeyValueStorage, key: string = STORAGE_KEY): LoadedDoc | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  try {
    const { doc, errors, warnings } = validateDoc(JSON.parse(raw) as unknown, "saved document");
    if (!doc || errors.length > 0) return null;
    return { doc, warnings };
  } catch {
    return null;
  }
}

export function clearDoc(storage: KeyValueStorage, key: string = STORAGE_KEY): void {
  storage.removeItem(key);
}

/** The file name a document downloads under, derived from its title. */
export function projectFileName(doc: Doc): string {
  const name = doc.title.trim().replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
  return name ? `swiftui-canvas ${name}.json` : "swiftui-canvas.json";
}

export function parseProjectFile(text: string): LoadedDoc | null {
  try {
    const { doc, errors, warnings } = validateDoc(JSON.parse(text) as unknown, "project file");
    if (!doc || errors.length > 0) return null;
    return { doc, warnings };
  } catch {
    return null;
  }
}
