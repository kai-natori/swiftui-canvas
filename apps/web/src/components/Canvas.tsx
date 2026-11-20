import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import {
  SCREEN_H,
  SCREEN_W,
  partSize,
  type Doc,
  type Lang,
  type Part,
  type Screen,
} from "@swiftui-canvas/core";

import {
  FIXED_SIZE_KINDS,
  clampPartToScreen,
  navigationArrows,
  snap,
  snapPosition,
  type SnapResult,
} from "~/lib/editor-logic";
import { t } from "~/lib/i18n";
import { ScreenView } from "./ScreenView";

/* The infinite canvas (canvas-editor spec, tasks 4.1/4.2/4.6).
 *
 * Coordinate systems: client px → world pt (via the view transform) →
 * screen-local pt (a part's x/y). Dragging is pointer-based with window
 * listeners; the Editor owns history, so a drag reports dragStart
 * (snapshot), transient moves, and dragEnd (commit).
 */

export type Selection = { type: "part" | "screen"; id: string } | null;

export interface View {
  x: number;
  y: number;
  k: number;
}

interface DragSession {
  mode: "pan" | "part" | "screen" | "resize";
  startClientX: number;
  startClientY: number;
  moved: boolean;
  viewStart?: View;
  partId?: string;
  partStartX?: number;
  partStartY?: number;
  partStartW?: number;
  partStartH?: number;
  screenId?: string;
  screenStartX?: number;
  screenStartY?: number;
  resizeDir?: "e" | "s" | "se";
}

export interface CanvasProps {
  doc: Doc;
  lang: Lang;
  selection: Selection;
  onSelect: (sel: Selection) => void;
  view: View;
  onViewChange: (v: View) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMovePart: (partId: string, x: number, y: number) => void;
  onResizePart: (partId: string, w: number, h: number) => void;
  onMoveScreen: (screenId: string, x: number, y: number) => void;
  onDropKind: (kind: Part["kind"], screenId: string, x: number, y: number) => void;
  onRenameScreen: (screen: Screen) => void;
}

export function Canvas(props: CanvasProps) {
  const { doc, view } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const session = useRef<DragSession | null>(null);
  const [guides, setGuides] = useState<{ screenId: string; snap: SnapResult } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setSpaceHeld(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const toWorld = (clientX: number, clientY: number): { x: number; y: number } => {
    const rect = hostRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - view.x) / view.k,
      y: (clientY - rect.top - view.y) / view.k,
    };
  };

  const beginSession = (s: DragSession) => {
    session.current = s;
    const move = (e: PointerEvent) => {
      const cur = session.current;
      if (!cur) return;
      const dx = (e.clientX - cur.startClientX) / view.k;
      const dy = (e.clientY - cur.startClientY) / view.k;
      if (Math.abs(e.clientX - cur.startClientX) + Math.abs(e.clientY - cur.startClientY) > 3) cur.moved = true;
      if (cur.mode === "pan" && cur.viewStart) {
        props.onViewChange({
          ...cur.viewStart,
          x: cur.viewStart.x + (e.clientX - cur.startClientX),
          y: cur.viewStart.y + (e.clientY - cur.startClientY),
        });
      } else if (cur.mode === "part" && cur.partId) {
        const part = doc.parts.find((p) => p.id === cur.partId);
        if (!part) return;
        const w = part.w ?? partSize(part.kind, part).w;
        const h = part.h ?? partSize(part.kind, part).h;
        const raw = clampPartToScreen((cur.partStartX ?? 0) + dx, (cur.partStartY ?? 0) + dy, w, h);
        const snapped = snapPosition(doc, part, raw.x, raw.y);
        setGuides(part.screen ? { screenId: part.screen, snap: snapped } : null);
        props.onMovePart(cur.partId, snapped.x, snapped.y);
      } else if (cur.mode === "screen" && cur.screenId) {
        props.onMoveScreen(cur.screenId, snap((cur.screenStartX ?? 0) + dx), snap((cur.screenStartY ?? 0) + dy));
      } else if (cur.mode === "resize" && cur.partId) {
        const part = doc.parts.find((p) => p.id === cur.partId);
        if (!part) return;
        let w = cur.partStartW ?? 100;
        let h = cur.partStartH ?? 40;
        if (cur.resizeDir === "e" || cur.resizeDir === "se") w = Math.max(24, snap((cur.partStartW ?? 0) + dx));
        if (cur.resizeDir === "s" || cur.resizeDir === "se") h = Math.max(part.kind === "divider" ? 1 : 16, snap((cur.partStartH ?? 0) + dy));
        props.onResizePart(cur.partId, w, h);
      }
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      const was = session.current;
      session.current = null;
      setGuides(null);
      if (was && was.mode !== "pan" && was.moved) props.onDragEnd();
      if (was && was.mode === "pan" && !was.moved) props.onSelect(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  };

  const onBackgroundPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return;
    beginSession({ mode: "pan", startClientX: e.clientX, startClientY: e.clientY, moved: false, viewStart: view });
  };

  const onWheel = (e: ReactWheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = hostRef.current?.getBoundingClientRect();
      if (!rect) return;
      const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      const k = Math.min(2, Math.max(0.15, view.k * factor));
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      props.onViewChange({
        k,
        x: mx - ((mx - view.x) / view.k) * k,
        y: my - ((my - view.y) / view.k) * k,
      });
    } else {
      props.onViewChange({ ...view, x: view.x - e.deltaX, y: view.y - e.deltaY });
    }
  };

  const fit = () => {
    const rect = hostRef.current?.getBoundingClientRect();
    if (!rect || doc.screens.length === 0) return;
    const minX = Math.min(...doc.screens.map((s) => s.x));
    const minY = Math.min(...doc.screens.map((s) => s.y));
    const maxX = Math.max(...doc.screens.map((s) => s.x + SCREEN_W));
    const maxY = Math.max(...doc.screens.map((s) => s.y + SCREEN_H));
    const k = Math.min(1.2, Math.min((rect.width - 80) / (maxX - minX), (rect.height - 80) / (maxY - minY)));
    props.onViewChange({
      k,
      x: (rect.width - (maxX - minX) * k) / 2 - minX * k,
      y: (rect.height - (maxY - minY) * k) / 2 - minY * k,
    });
  };

  const zoomBy = (f: number) => {
    const rect = hostRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 0;
    const cy = rect ? rect.height / 2 : 0;
    const k = Math.min(2, Math.max(0.15, view.k * f));
    props.onViewChange({ k, x: cx - ((cx - view.x) / view.k) * k, y: cy - ((cy - view.y) / view.k) * k });
  };

  const arrows = navigationArrows(doc);
  const bounds = arrows.length
    ? {
        minX: Math.min(...doc.screens.map((s) => s.x), ...arrows.map((a) => a.x1)) - 60,
        minY: Math.min(...doc.screens.map((s) => s.y), ...arrows.map((a) => a.y1)) - 60,
        maxX: Math.max(...doc.screens.map((s) => s.x + SCREEN_W), ...arrows.map((a) => a.x2)) + 60,
        maxY: Math.max(...doc.screens.map((s) => s.y + SCREEN_H), ...arrows.map((a) => a.y2)) + 60,
      }
    : null;

  const selection = props.selection;
  const selectedPart =
    selection?.type === "part" ? doc.parts.find((p) => p.id === selection.id) : undefined;

  return (
    <div
      ref={hostRef}
      className="canvas-host"
      onPointerDown={onBackgroundPointerDown}
      onWheel={onWheel}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const kind = e.dataTransfer.getData("application/x-sc-kind") as Part["kind"];
        if (!kind) return;
        const w = toWorld(e.clientX, e.clientY);
        const screen = doc.screens.find(
          (s) => w.x >= s.x && w.x <= s.x + SCREEN_W && w.y >= s.y && w.y <= s.y + SCREEN_H,
        );
        if (!screen) return;
        props.onDropKind(kind, screen.id, snap(w.x - screen.x - 40), snap(w.y - screen.y - 20));
      }}
      style={{ cursor: spaceHeld ? "grab" : undefined }}
    >
      <div
        className="canvas-world"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
      >
        {bounds ? (
          <svg
            style={{ position: "absolute", left: bounds.minX, top: bounds.minY, overflow: "visible", pointerEvents: "none", zIndex: 1 }}
            width={bounds.maxX - bounds.minX}
            height={bounds.maxY - bounds.minY}
          >
            <defs>
              <marker id="sc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="var(--sc-accent)" />
              </marker>
            </defs>
            {arrows.map((a) => {
              const x1 = a.x1 - bounds.minX;
              const y1 = a.y1 - bounds.minY;
              const x2 = a.x2 - bounds.minX;
              const y2 = a.y2 - bounds.minY;
              const mx = (x1 + x2) / 2;
              return (
                <path
                  key={a.key}
                  d={`M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="var(--sc-accent)"
                  strokeWidth={2}
                  strokeDasharray={a.transition === "sheet" || a.transition === "cover" ? "7 5" : undefined}
                  opacity={0.75}
                  markerEnd="url(#sc-arrow)"
                />
              );
            })}
          </svg>
        ) : null}

        {doc.screens.map((screen) => {
          const isScreenSelected = selection?.type === "screen" && selection.id === screen.id;
          return (
            <div key={screen.id} style={{ position: "absolute", left: screen.x, top: screen.y, zIndex: 2 }}>
              <div
                className="screen-label"
                data-selected={isScreenSelected ? "true" : "false"}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.stopPropagation();
                  props.onSelect({ type: "screen", id: screen.id });
                  props.onDragStart();
                  beginSession({
                    mode: "screen",
                    startClientX: e.clientX,
                    startClientY: e.clientY,
                    moved: false,
                    screenId: screen.id,
                    screenStartX: screen.x,
                    screenStartY: screen.y,
                  });
                }}
                onDoubleClick={() => props.onRenameScreen(screen)}
              >
                {screen.name}
              </div>
              <div
                className="screen-frame"
                data-selected={isScreenSelected ? "true" : "false"}
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest("[data-part-id]")) return;
                  e.stopPropagation();
                  props.onSelect({ type: "screen", id: screen.id });
                }}
              >
                <ScreenView
                  doc={doc}
                  screen={screen}
                  partWrapperProps={(part) => ({
                    dataSelected: selection?.type === "part" && selection.id === part.id,
                    onPointerDown: (e) => {
                      if (e.button !== 0 || spaceHeld) return;
                      e.stopPropagation();
                      props.onSelect({ type: "part", id: part.id });
                      props.onDragStart();
                      beginSession({
                        mode: "part",
                        startClientX: e.clientX,
                        startClientY: e.clientY,
                        moved: false,
                        partId: part.id,
                        partStartX: part.x,
                        partStartY: part.y,
                      });
                    },
                    style:
                      selection?.type === "part" && selection.id === part.id
                        ? { outline: "2px solid var(--sc-accent)", outlineOffset: 2, borderRadius: 6 }
                        : undefined,
                  })}
                />
                {/* guides + resize handles overlay */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
                  {guides && guides.screenId === screen.id
                    ? [
                        ...guides.snap.vGuides.map((x, i) => (
                          <div key={`v${i}`} style={{ position: "absolute", left: x, top: 0, bottom: 0, width: 1, background: "#FF6482", opacity: 0.9 }} />
                        )),
                        ...guides.snap.hGuides.map((y, i) => (
                          <div key={`h${i}`} style={{ position: "absolute", top: y, left: 0, right: 0, height: 1, background: "#FF6482", opacity: 0.9 }} />
                        )),
                      ]
                    : null}
                  {selectedPart && selectedPart.screen === screen.id && !FIXED_SIZE_KINDS.has(selectedPart.kind)
                    ? (["e", "s", "se"] as const).map((dir) => {
                        const pw = selectedPart.w ?? partSize(selectedPart.kind, selectedPart).w;
                        const ph = selectedPart.h ?? partSize(selectedPart.kind, selectedPart).h;
                        const pos =
                          dir === "e"
                            ? { left: selectedPart.x + pw - 7, top: selectedPart.y + ph / 2 - 7 }
                            : dir === "s"
                              ? { left: selectedPart.x + pw / 2 - 7, top: selectedPart.y + ph - 7 }
                              : { left: selectedPart.x + pw - 7, top: selectedPart.y + ph - 7 };
                        return (
                          <div
                            key={dir}
                            className="resize-handle"
                            style={{ ...pos, pointerEvents: "auto", cursor: dir === "e" ? "ew-resize" : dir === "s" ? "ns-resize" : "nwse-resize" }}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              props.onDragStart();
                              beginSession({
                                mode: "resize",
                                startClientX: e.clientX,
                                startClientY: e.clientY,
                                moved: false,
                                partId: selectedPart.id,
                                partStartW: pw,
                                partStartH: ph,
                                resizeDir: dir,
                              });
                            }}
                          />
                        );
                      })
                    : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="canvas-controls" onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => zoomBy(1 / 1.2)} aria-label={t(props.lang, "toolbar.zoomOut")}>−</button>
        <span>{Math.round(view.k * 100)}%</span>
        <button type="button" onClick={() => zoomBy(1.2)} aria-label={t(props.lang, "toolbar.zoomIn")}>+</button>
        <button type="button" onClick={fit}>{t(props.lang, "toolbar.fit")}</button>
      </div>
    </div>
  );
}
