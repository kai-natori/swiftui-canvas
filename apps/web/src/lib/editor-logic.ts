import {
  BACK_TARGET,
  CHROME_BOTTOM,
  CHROME_TOP,
  GRID,
  MARGIN,
  SCREEN_H,
  SCREEN_W,
  duplicatePart,
  newId,
  partSize,
  partsOf,
  type Doc,
  type Part,
  type Transition,
  type Screen,
} from "@swiftui-canvas/core";

/* Pure editor geometry and document transforms, kept out of the React
 * components so they can be unit-tested: snapping with guides, tidy,
 * screen duplication with reference remapping, and navigation arrows.
 */

export const snap = (v: number): number => Math.round(v / GRID) * GRID;

export function autoPlacePart(doc: Doc, screenId: string, part: Part): { x: number; y: number } {
  const screen = doc.screens.find((s) => s.id === screenId);
  const parts = partsOf(doc, screenId);
  const height = (p: Part) => p.h ?? partSize(p.kind, p).h;
  const width = (p: Part) => p.w ?? partSize(p.kind, p).w;
  const top = Math.max(
    screen?.chrome ? CHROME_TOP : 0,
    ...parts.filter((p) => p.kind === "navBar").map((p) => p.y + height(p)),
  ) + MARGIN;
  const bottom = Math.min(
    SCREEN_H - (screen?.chrome ? CHROME_BOTTOM : 0),
    ...parts.filter((p) => p.kind === "tabBar").map((p) => p.y),
  ) - MARGIN;
  const x = MARGIN;
  const h = height(part);
  const firstY = Math.ceil(top / GRID) * GRID;
  const lastY = Math.max(firstY, Math.floor((bottom - h) / GRID) * GRID);
  const occupied = parts
    .filter((p) => p.kind !== "navBar" && p.kind !== "tabBar" && p.kind !== "sheet" &&
      p.x < x + width(part) && p.x + width(p) > x &&
      p.y < bottom && p.y + height(p) > top)
    .sort((a, b) => a.y - b.y);
  const after = occupied.length
    ? Math.ceil((Math.max(...occupied.map((p) => p.y + height(p))) + MARGIN) / GRID) * GRID
    : firstY;
  if (after + h <= bottom) return { x, y: after };
  let cursor = firstY;
  for (const p of occupied) {
    if (cursor + h + MARGIN <= p.y) return { x, y: cursor };
    cursor = Math.max(cursor, Math.ceil((p.y + height(p) + MARGIN) / GRID) * GRID);
  }
  // A full screen may require overlap, but never place below its content bounds.
  return { x, y: lastY };
}

export interface SnapResult {
  x: number;
  y: number;
  /** Guide positions in screen coordinates (vertical lines at x, horizontal at y). */
  vGuides: number[];
  hGuides: number[];
}

const GUIDE_THRESHOLD = 6;

/** Snap a moving part's position to the 8pt grid and to guides: the
 *  screen edges, the 16pt margins, the screen centre, and the edges /
 *  centres of the other parts on the same screen. */
export function snapPosition(
  doc: Doc,
  part: Part,
  rawX: number,
  rawY: number,
): SnapResult {
  const w = part.w ?? partSize(part.kind, part).w;
  const h = part.h ?? partSize(part.kind, part).h;
  let x = snap(rawX);
  let y = snap(rawY);
  const vGuides: number[] = [];
  const hGuides: number[] = [];

  interface Target {
    pos: number;
    line: number;
  }
  const xTargets: Target[] = [
    { pos: 0, line: 0 },
    { pos: MARGIN, line: MARGIN },
    { pos: SCREEN_W - w, line: SCREEN_W },
    { pos: SCREEN_W - MARGIN - w, line: SCREEN_W - MARGIN },
    { pos: (SCREEN_W - w) / 2, line: SCREEN_W / 2 },
  ];
  const yTargets: Target[] = [
    { pos: CHROME_TOP, line: CHROME_TOP },
    { pos: SCREEN_H - CHROME_BOTTOM - h, line: SCREEN_H - CHROME_BOTTOM },
    { pos: (SCREEN_H - h) / 2, line: SCREEN_H / 2 },
  ];
  if (part.screen) {
    for (const other of partsOf(doc, part.screen)) {
      if (other.id === part.id) continue;
      const ow = other.w ?? partSize(other.kind, other).w;
      const oh = other.h ?? partSize(other.kind, other).h;
      xTargets.push(
        { pos: other.x, line: other.x },
        { pos: other.x + ow - w, line: other.x + ow },
        { pos: other.x + ow / 2 - w / 2, line: other.x + ow / 2 },
      );
      yTargets.push(
        { pos: other.y, line: other.y },
        { pos: other.y + oh - h, line: other.y + oh },
        { pos: other.y + oh / 2 - h / 2, line: other.y + oh / 2 },
      );
    }
  }
  for (const target of xTargets) {
    if (Math.abs(rawX - target.pos) <= GUIDE_THRESHOLD) {
      x = target.pos;
      vGuides.push(target.line);
    }
  }
  for (const target of yTargets) {
    if (Math.abs(rawY - target.pos) <= GUIDE_THRESHOLD) {
      y = target.pos;
      hGuides.push(target.line);
    }
  }
  return { x, y, vGuides: [...new Set(vGuides)], hGuides: [...new Set(hGuides)] };
}

export const clampPartToScreen = (x: number, y: number, w: number, h: number): { x: number; y: number } => ({
  x: Math.min(Math.max(x, -w + 40), SCREEN_W - 40),
  y: Math.min(Math.max(y, 0), SCREEN_H - 24),
});

/** Tidy one screen (canvas-editor spec): bars snap to the edges, the
 *  remaining parts restack on 16pt margins in the body area between the
 *  navigation bar and the tab bar / bottom chrome. One pure transform,
 *  applied as a single undoable step by the caller. */
export function tidyScreen(doc: Doc, screenId: string): Doc {
  const parts = partsOf(doc, screenId);
  if (parts.length === 0) return doc;
  const nav = parts.find((p) => p.kind === "navBar");
  const tab = parts.find((p) => p.kind === "tabBar");
  const sheetParts = parts.filter((p) => p.kind === "sheet");
  const rest = parts
    .filter((p) => p.kind !== "navBar" && p.kind !== "tabBar" && p.kind !== "sheet")
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const moved = new Map<string, { x: number; y: number }>();
  if (nav) moved.set(nav.id, { x: 0, y: CHROME_TOP });
  if (tab) {
    const th = tab.h ?? 62;
    moved.set(tab.id, { x: MARGIN, y: SCREEN_H - CHROME_BOTTOM - th - 8 });
  }
  for (const s of sheetParts) {
    const sh = s.h ?? partSize("sheet").h;
    moved.set(s.id, { x: 0, y: SCREEN_H - sh });
  }
  const topLimit = nav ? CHROME_TOP + (nav.h ?? partSize("navBar", nav).h) + 8 : CHROME_TOP + 8;
  const bottomLimit = tab
    ? SCREEN_H - CHROME_BOTTOM - (tab.h ?? 62) - 24
    : SCREEN_H - CHROME_BOTTOM - 8;
  let cursor = topLimit;
  for (const part of rest) {
    const w = part.w ?? partSize(part.kind, part).w;
    const h = part.h ?? partSize(part.kind, part).h;
    const x =
      part.kind === "alert" || part.kind === "progress" && part.variant === "circular"
        ? Math.round((SCREEN_W - w) / 2)
        : part.kind === "iconButton"
          ? Math.min(Math.max(part.x, MARGIN), SCREEN_W - MARGIN - w)
          : MARGIN;
    if (cursor + h > bottomLimit && cursor > topLimit) break;
    moved.set(part.id, { x, y: cursor });
    cursor += h + 16;
  }
  return {
    ...doc,
    parts: doc.parts.map((p) => {
      const m = p.screen === screenId ? moved.get(p.id) : undefined;
      return m ? { ...p, x: m.x, y: m.y } : p;
    }),
  };
}

/** Duplicate a screen with its parts. Ids are remapped; links and
 *  option targets that pointed at the source screen (or at parts on it,
 *  for `presents`) point at the copies; references to other screens are
 *  kept. */
export function duplicateScreenDoc(doc: Doc, screenId: string, dx = 48, dy = 48): { doc: Doc; screen: Screen } {
  const source = doc.screens.find((s) => s.id === screenId);
  if (!source) return { doc, screen: doc.screens[0] as Screen };
  const screenMap = new Map<string, string>([[source.id, newId()]]);
  const partMap = new Map<string, string>();
  const sourceParts = partsOf(doc, screenId);
  for (const p of sourceParts) partMap.set(p.id, newId());

  const remapTarget = (target: string): string =>
    target === BACK_TARGET ? target : (screenMap.get(target) ?? target);

  const screen: Screen = { ...source, id: screenMap.get(source.id) as string, x: source.x + dx, y: source.y + dy, name: `${source.name} copy` };
  const parts: Part[] = sourceParts.map((p) => {
    const copy = duplicatePart(p, partMap.get(p.id) as string);
    copy.screen = screen.id;
    if (copy.link) copy.link = { ...copy.link, target: remapTarget(copy.link.target) };
    if (copy.options) {
      copy.options = copy.options.map((o) => ({
        ...o,
        target: o.target ? remapTarget(o.target) : o.target,
      }));
    }
    if (copy.presents) copy.presents = partMap.get(copy.presents) ?? undefined;
    return copy;
  });
  return { doc: { ...doc, screens: [...doc.screens, screen], parts: [...doc.parts, ...parts] }, screen };
}

export interface Arrow {
  key: string;
  fromPartId: string;
  /** World coordinates. */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  transition: Transition;
}

/** Navigation arrows in world coordinates: from each linked part to the
 *  centre of its target screen's nearest edge. */
export function navigationArrows(doc: Doc): Arrow[] {
  const arrows: Arrow[] = [];
  const screens = new Map(doc.screens.map((s) => [s.id, s]));
  for (const part of doc.parts) {
    if (!part.link || !part.screen) continue;
    const from = screens.get(part.screen);
    const to = screens.get(part.link.target);
    if (!from || !to) continue;
    const w = part.w ?? partSize(part.kind, part).w;
    const h = part.h ?? partSize(part.kind, part).h;
    const x1 = from.x + part.x + w / 2;
    const y1 = from.y + part.y + h / 2;
    const cx = to.x + SCREEN_W / 2;
    const cy = to.y + SCREEN_H / 2;
    // Point on the target screen's border closest to the source centre.
    const dx = x1 - cx;
    const dy = y1 - cy;
    const scale = Math.max(Math.abs(dx) / (SCREEN_W / 2), Math.abs(dy) / (SCREEN_H / 2), 0.0001);
    const x2 = cx + dx / scale;
    const y2 = cy + dy / scale;
    arrows.push({
      key: `${part.id}->${to.id}`,
      fromPartId: part.id,
      x1, y1, x2, y2,
      transition: part.link.transition,
    });
  }
  // Option targets (tab rows / list rows) also create flow.
  for (const part of doc.parts) {
    if (!part.screen || !part.options) continue;
    const from = screens.get(part.screen);
    if (!from) continue;
    part.options.forEach((o, i) => {
      if (!o.target) return;
      const to = screens.get(o.target);
      if (!to) return;
      const w = part.w ?? partSize(part.kind, part).w;
      const h = part.h ?? partSize(part.kind, part).h;
      arrows.push({
        key: `${part.id}#${i}->${to.id}`,
        fromPartId: part.id,
        x1: from.x + part.x + w / 2,
        y1: from.y + part.y + h / 2,
        x2: to.x + SCREEN_W / 2,
        y2: to.y + 24,
        transition: "push",
      });
    });
  }
  return arrows;
}

/** Kinds whose size is fixed by the design system (no resize handles). */
export const FIXED_SIZE_KINDS = new Set(["navBar", "tabBar", "sheet", "divider"]);

export { newId };
