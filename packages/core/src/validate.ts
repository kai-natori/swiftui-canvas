import {
  BACK_TARGET,
  KIND_ORDER,
  KIND_VARIANTS,
  LANGS,
  SCREEN_BGS,
  TRANSITIONS,
  newId,
  type Doc,
  type Kind,
  type Part,
  type Screen,
  type Theme,
} from "./model";

/* Two-tier validation (document-model spec):
 * - isProject: strict. Used when saving; any malformation rejects.
 * - validateDoc: tolerant ingress for share links / opened files.
 *   Broken parts are dropped, dangling references are removed, duplicate
 *   ids are renamed, and every repair is reported as a warning. A
 *   document is rejected only when its theme or screen list is unusable.
 */

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const KINDS = new Set<string>(KIND_ORDER);

const isVariantFor = (kind: string, variant: unknown): boolean =>
  typeof variant === "string" &&
  ((KIND_VARIANTS[kind as Kind] ?? []) as string[]).includes(variant);

const isTransition = (t: unknown): boolean => typeof t === "string" && (TRANSITIONS as string[]).includes(t);

const validOption = (o: unknown): boolean =>
  isRecord(o) &&
  typeof o.label === "string" &&
  (o.icon === undefined || o.icon === null || typeof o.icon === "string") &&
  (o.target === undefined || o.target === null || typeof o.target === "string");

const validLink = (l: unknown): boolean => isRecord(l) && typeof l.target === "string" && isTransition(l.transition);

const validDateTime = (v: unknown): boolean => {
  if (typeof v !== "string") return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return false;
  const [y, mo, d, h, mi] = m.slice(1).map(Number) as [number, number, number, number, number];
  const t = new Date(0);
  t.setUTCFullYear(y, mo - 1, d);
  t.setUTCHours(h, mi, 0, 0);
  return (
    t.getUTCFullYear() === y &&
    t.getUTCMonth() === mo - 1 &&
    t.getUTCDate() === d &&
    t.getUTCHours() === h &&
    t.getUTCMinutes() === mi
  );
};

export const validPart = (p: unknown): p is Part =>
  isRecord(p) &&
  typeof p.id === "string" &&
  (p.screen === null || typeof p.screen === "string") &&
  typeof p.kind === "string" &&
  KINDS.has(p.kind) &&
  typeof p.label === "string" &&
  finite(p.x) &&
  finite(p.y) &&
  isVariantFor(p.kind, p.variant) &&
  (p.options === undefined || (Array.isArray(p.options) && p.options.every(validOption))) &&
  (p.icon === undefined || p.icon === null || typeof p.icon === "string") &&
  (p.supporting === undefined || typeof p.supporting === "string") &&
  (p.note === undefined || typeof p.note === "string") &&
  (p.presents === undefined || typeof p.presents === "string") &&
  (p.checked === undefined || typeof p.checked === "boolean") &&
  (p.selected === undefined || finite(p.selected)) &&
  (p.value === undefined || finite(p.value)) &&
  (p.kind !== "gauge" || p.value === undefined || (finite(p.value) && p.value >= 0 && p.value <= 1)) &&
  (p.displayedComponents === undefined || ["date", "time", "both"].includes(p.displayedComponents as string)) &&
  (p.date === undefined || validDateTime(p.date)) &&
  (p.color === undefined || (typeof p.color === "string" && /^#[0-9a-fA-F]{6}$/.test(p.color))) &&
  (p.w === undefined || (finite(p.w) && p.w > 0)) &&
  (p.h === undefined || (finite(p.h) && p.h > 0)) &&
  (p.link === undefined || validLink(p.link));

export const validScreen = (s: unknown): s is Screen =>
  isRecord(s) &&
  typeof s.id === "string" &&
  typeof s.name === "string" &&
  finite(s.x) &&
  finite(s.y) &&
  (s.note === undefined || typeof s.note === "string") &&
  typeof s.chrome === "boolean" &&
  (s.bg === undefined ||
    (typeof s.bg === "string" && ((SCREEN_BGS as readonly string[]).includes(s.bg) || /^#[0-9a-fA-F]{3,8}$/.test(s.bg))));

export const validTheme = (t: unknown): t is Theme =>
  isRecord(t) &&
  typeof t.accent === "string" &&
  (t.scheme === "light" || t.scheme === "dark") &&
  (t.shape === "default" || t.shape === "capsule") &&
  (t.font === "system" || t.font === "rounded" || t.font === "serif" || t.font === "monospaced");

function refsIntact(screens: Screen[], parts: Part[]): boolean {
  const ids = new Set(screens.map((s) => s.id));
  if (ids.size !== screens.length) return false;
  const partIds = new Set(parts.map((p) => p.id));
  if (partIds.size !== parts.length) return false;
  const okTarget = (t: string) => t === BACK_TARGET || ids.has(t);
  return parts.every((p) => {
    if (p.screen !== null && !ids.has(p.screen)) return false;
    if (p.link && !okTarget(p.link.target)) return false;
    if (p.options?.some((o) => o.target != null && !okTarget(o.target))) return false;
    if (p.presents) {
      const q = parts.find((x) => x.id === p.presents);
      if (!q || q.screen !== p.screen || (q.kind !== "alert" && q.kind !== "sheet")) return false;
    }
    return true;
  });
}

export function isProject(v: unknown): v is Doc {
  return (
    isRecord(v) &&
    v.version === 1 &&
    typeof v.title === "string" &&
    (LANGS as string[]).includes(v.lang as string) &&
    validTheme(v.theme) &&
    Array.isArray(v.screens) &&
    v.screens.length > 0 &&
    v.screens.every(validScreen) &&
    Array.isArray(v.parts) &&
    v.parts.every(validPart) &&
    refsIntact(v.screens as Screen[], v.parts as Part[])
  );
}

/* ---------- tolerant ingress ---------- */

export interface Validated {
  doc: Doc | null;
  errors: string[];
  warnings: string[];
}

export function validateDoc(value: unknown, label = "document"): Validated {
  const warnings: string[] = [];
  if (!isRecord(value)) return { doc: null, errors: [`${label}: is not a JSON object`], warnings };
  if (!validTheme(value.theme)) return { doc: null, errors: [`${label}: theme is missing or malformed`], warnings };
  if (!Array.isArray(value.screens) || value.screens.length === 0 || !value.screens.every(validScreen)) {
    return { doc: null, errors: [`${label}: screens are missing or malformed`], warnings };
  }
  const screens: Screen[] = (value.screens as Screen[]).map((s) => ({ ...s }));
  const seenScreens = new Set<string>();
  for (const s of screens) {
    if (seenScreens.has(s.id)) {
      s.id = newId();
      warnings.push(`${label}: duplicate screen id renamed (${s.id})`);
    }
    seenScreens.add(s.id);
  }
  const ids = new Set(screens.map((s) => s.id));
  const okTarget = (t: string) => t === BACK_TARGET || ids.has(t);

  const seen = new Set<string>();
  const parts: Part[] = [];
  const rawParts = Array.isArray(value.parts) ? value.parts : [];
  for (const raw of rawParts) {
    if (!validPart(raw)) {
      warnings.push(
        `${label}: dropped a malformed part${isRecord(raw) && typeof raw.id === "string" ? ` (${raw.id})` : ""}`,
      );
      continue;
    }
    let p: Part = { ...raw };
    if (seen.has(p.id)) {
      p = { ...p, id: newId() };
      warnings.push(`${label}: duplicate part id renamed (${p.id})`);
    }
    seen.add(p.id);
    if (p.screen !== null && !ids.has(p.screen)) {
      p = { ...p, screen: null };
      warnings.push(`${label}: part referenced a missing screen, moved to the workspace (${p.id})`);
    }
    if (p.link && !okTarget(p.link.target)) {
      p = { ...p, link: undefined };
      warnings.push(`${label}: part linked to a missing screen, link removed (${p.id})`);
    }
    if (p.options?.some((o) => o.target != null && !okTarget(o.target))) {
      p = { ...p, options: p.options.map((o) => (o.target != null && !okTarget(o.target) ? { ...o, target: null } : o)) };
      warnings.push(`${label}: part had an option pointing at a missing screen, target removed (${p.id})`);
    }
    parts.push(p);
  }
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!;
    if (!p.presents) continue;
    const q = parts.find((x) => x.id === p.presents);
    if (!q || q.screen !== p.screen || (q.kind !== "alert" && q.kind !== "sheet")) {
      parts[i] = { ...p, presents: undefined };
      warnings.push(`${label}: part presented a missing or off-screen alert/sheet, presentation removed (${p.id})`);
    }
  }
  if (typeof value.title !== "string") warnings.push(`${label}: missing title, set to "Untitled App"`);
  if (value.lang !== undefined && !(LANGS as string[]).includes(value.lang as string)) {
    warnings.push(`${label}: unknown language, using "en"`);
  }
  const doc: Doc = {
    version: 1,
    title: typeof value.title === "string" ? value.title : "Untitled App",
    lang: (LANGS as string[]).includes(value.lang as string) ? (value.lang as Doc["lang"]) : "en",
    theme: value.theme as Theme,
    screens,
    parts,
  };
  return { doc, errors: [], warnings };
}

/** Paste a whole document beside the current one: ids are remapped so
 *  nothing collides and internal links keep pointing at the copies. */
export function mergeDoc(incoming: Doc, current: Doc): { doc: Doc; idMap: Map<string, string> } {
  const idOf = new Map<string, string>();
  for (const s of incoming.screens) idOf.set(s.id, newId());
  for (const p of incoming.parts) idOf.set(p.id, newId());
  const remap = (t: string) => (t === BACK_TARGET ? BACK_TARGET : idOf.get(t));
  const screens = incoming.screens.map((s) => ({ ...s, id: idOf.get(s.id)! }));
  const parts = incoming.parts.map((p) => ({
    ...p,
    id: idOf.get(p.id)!,
    screen: p.screen === null ? null : (idOf.get(p.screen) ?? null),
    link: p.link && remap(p.link.target) !== undefined ? { ...p.link, target: remap(p.link.target)! } : undefined,
    options: p.options?.map((o) => ({ ...o, target: o.target ? (remap(o.target) ?? null) : null })),
    presents: p.presents ? idOf.get(p.presents) : undefined,
  }));
  return { doc: { ...current, screens: [...current.screens, ...screens], parts: [...current.parts, ...parts] }, idMap: idOf };
}
