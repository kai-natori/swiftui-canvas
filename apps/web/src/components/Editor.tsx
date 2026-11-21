import { useCallback, useEffect, useRef, useState } from "react";

import {
  LANGS,
  SCREEN_W,
  defaultPart,
  docFromHashDetailed,
  duplicatePart,
  loadDoc,
  newDoc,
  newScreen,
  parseProjectFile,
  projectFileName,
  saveDoc,
  shareLink,
  type Doc,
  type Kind,
  type Lang,
  type Screen,
} from "@swiftui-canvas/core";
import { GlassSurface } from "@swiftui-canvas/glass";

import { takePendingPart } from "~/lib/catalog";
import { autoPlacePart, duplicateScreenDoc, snap, tidyScreen } from "~/lib/editor-logic";
import { LANG_NAMES, t } from "~/lib/i18n";
import { SfIcon } from "~/lib/symbols";
import { Canvas, type Selection, type View } from "./Canvas";
import { Inspector } from "./Inspector";
import { Palette } from "./Palette";
import { Preview } from "./Preview";
import { PromptPanel } from "./PromptPanel";
import { ThemePanel } from "./ThemePanel";

/* The editor (tasks 4.x, 5.1, 6.3, 7.x): composition, document state
 * with undo/redo history, persistence (localStorage autosave, JSON
 * save/open, #sc= share links through tolerant ingress with warnings),
 * and the keyboard map.
 */

const MAX_SCREENS_X = 6;

export function Editor() {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [view, setView] = useState<View>({ x: 120, y: 70, k: 0.62 });
  const [showPrompt, setShowPrompt] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const past = useRef<Doc[]>([]);
  const future = useRef<Doc[]>([]);
  const dragSnapshot = useRef<Doc | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [, setHistoryTick] = useState(0);

  /* ---- initial load: share hash → localStorage → new document ------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fromHash = window.location.hash ? await docFromHashDetailed(window.location.hash) : null;
      if (cancelled) return;
      if (fromHash) {
        setDoc(fromHash.doc);
        if (fromHash.warnings.length > 0) setWarnings(fromHash.warnings);
        return;
      }
      const saved = loadDoc(window.localStorage);
      if (saved) {
        setDoc(saved.doc);
        if (saved.warnings.length > 0) setWarnings(saved.warnings);
        return;
      }
      setDoc(newDoc("en"));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- autosave ------------------------------------------------------ */
  useEffect(() => {
    if (doc) saveDoc(window.localStorage, doc);
  }, [doc]);

  const commit = useCallback((next: Doc) => {
    setDoc((prev) => {
      if (prev) {
        past.current.push(prev);
        if (past.current.length > 200) past.current.shift();
      }
      future.current = [];
      return next;
    });
    setHistoryTick((n) => n + 1);
  }, []);

  const update = useCallback(
    (fn: (d: Doc) => Doc) => {
      setDoc((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        if (next === prev) return prev;
        past.current.push(prev);
        if (past.current.length > 200) past.current.shift();
        future.current = [];
        return next;
      });
      setHistoryTick((n) => n + 1);
    },
    [],
  );

  const undo = useCallback(() => {
    setDoc((prev) => {
      const last = past.current.pop();
      if (!prev || !last) return prev;
      future.current.push(prev);
      return last;
    });
    setHistoryTick((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    setDoc((prev) => {
      const next = future.current.pop();
      if (!prev || !next) return prev;
      past.current.push(prev);
      return next;
    });
    setHistoryTick((n) => n + 1);
  }, []);

  /* ---- drag plumbing (transient moves, one history step per drag) ---- */
  const onDragStart = useCallback(() => {
    setDoc((prev) => {
      dragSnapshot.current = prev;
      return prev;
    });
  }, []);

  const onDragEnd = useCallback(() => {
    const snapshot = dragSnapshot.current;
    dragSnapshot.current = null;
    if (snapshot) {
      past.current.push(snapshot);
      if (past.current.length > 200) past.current.shift();
      future.current = [];
      setHistoryTick((n) => n + 1);
    }
  }, []);

  const movePart = useCallback((partId: string, x: number, y: number) => {
    setDoc((prev) =>
      prev ? { ...prev, parts: prev.parts.map((p) => (p.id === partId ? { ...p, x, y } : p)) } : prev,
    );
  }, []);

  const resizePart = useCallback((partId: string, w: number, h: number) => {
    setDoc((prev) =>
      prev ? { ...prev, parts: prev.parts.map((p) => (p.id === partId ? { ...p, w, h } : p)) } : prev,
    );
  }, []);

  const moveScreen = useCallback((screenId: string, x: number, y: number) => {
    setDoc((prev) =>
      prev ? { ...prev, screens: prev.screens.map((s) => (s.id === screenId ? { ...s, x, y } : s)) } : prev,
    );
  }, []);

  /* ---- document operations ------------------------------------------- */
  const addScreen = useCallback(() => {
    if (!doc) return;
    const index = doc.screens.length;
    const col = index % MAX_SCREENS_X;
    const row = Math.floor(index / MAX_SCREENS_X);
    const screen = newScreen(doc.lang, index, col * (SCREEN_W + 80), row * 980);
    update((d) => ({ ...d, screens: [...d.screens, screen] }));
    setSelection({ type: "screen", id: screen.id });
  }, [doc, update]);

  const addPartToScreen = useCallback(
    (kind: Kind, screenId: string, x?: number, y?: number) => {
      if (!doc) return;
      const part = defaultPart(doc.lang, screenId, kind, 0, 0);
      const placement = autoPlacePart(doc, screenId, part);
      part.x = x === undefined ? placement.x : snap(x);
      part.y = y === undefined ? placement.y : snap(y);
      if (kind === "navBar") {
        part.x = 0;
        part.y = 59;
      }
      if (kind === "tabBar") {
        part.x = 16;
        part.y = 852 - 34 - 62 - 8;
      }
      if (kind === "sheet") {
        part.x = 0;
        part.y = 852 - (part.h ?? 260);
      }
      update((d) => ({ ...d, parts: [...d.parts, part] }));
      setSelection({ type: "part", id: part.id });
    },
    [doc, update],
  );

  const activeScreenId =
    selection?.type === "part"
      ? (doc?.parts.find((p) => p.id === selection.id)?.screen ?? doc?.screens[0]?.id)
      : selection?.type === "screen"
        ? selection.id
        : doc?.screens[0]?.id;

  /* ---- "Add to editor" hand-off from the Components catalog --------- */
  const pendingHandled = useRef(false);
  useEffect(() => {
    if (!doc || pendingHandled.current) return;
    pendingHandled.current = true;
    let kind: Kind | null = null;
    try {
      kind = takePendingPart(window.localStorage);
    } catch {
      kind = null;
    }
    const firstScreen = doc.screens[0];
    if (kind && firstScreen) addPartToScreen(kind, firstScreen.id);
  }, [doc, addPartToScreen]);

  const duplicateScreen = useCallback(
    (id: string) => {
      if (!doc) return;
      const { doc: next, screen } = duplicateScreenDoc(doc, id);
      commit(next);
      setSelection({ type: "screen", id: screen.id });
    },
    [doc, commit],
  );

  const deleteScreen = useCallback(
    (id: string) => {
      update((d) => ({
        ...d,
        screens: d.screens.filter((s) => s.id !== id),
        parts: d.parts.filter((p) => p.screen !== id),
      }));
      setSelection(null);
    },
    [update],
  );

  const deletePart = useCallback(
    (id: string) => {
      update((d) => ({
        ...d,
        parts: d.parts
          .filter((p) => p.id !== id)
          .map((p) => (p.presents === id ? { ...p, presents: undefined } : p)),
      }));
      setSelection(null);
    },
    [update],
  );

  const duplicatePartById = useCallback(
    (id: string) => {
      if (!doc) return;
      const part = doc.parts.find((p) => p.id === id);
      if (!part) return;
      const copy = duplicatePart(part);
      copy.x = snap(part.x + 16);
      copy.y = snap(part.y + 16);
      copy.presents = undefined;
      update((d) => ({ ...d, parts: [...d.parts, copy] }));
      setSelection({ type: "part", id: copy.id });
    },
    [doc, update],
  );

  const doTidy = useCallback(() => {
    if (!doc || !activeScreenId) return;
    update((d) => tidyScreen(d, activeScreenId));
  }, [doc, activeScreenId, update]);

  /* ---- file / share ---------------------------------------------------- */
  const saveJson = useCallback(() => {
    if (!doc) return;
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = projectFileName(doc);
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 500);
  }, [doc]);

  const openJson = useCallback(
    async (file: File) => {
      const parsed = parseProjectFile(await file.text());
      if (!parsed) return;
      commit(parsed.doc);
      setSelection(null);
      if (parsed.warnings.length > 0) setWarnings(parsed.warnings);
    },
    [commit],
  );

  const share = useCallback(async () => {
    if (!doc) return;
    const link = await shareLink(doc, `${window.location.origin}${window.location.pathname}`);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt("Share link", link);
    }
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1600);
  }, [doc]);

  /* ---- keyboard -------------------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      if (typing) return;
      if (!doc) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selection?.type === "part") duplicatePartById(selection.id);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selection) {
        e.preventDefault();
        if (selection.type === "part") deletePart(selection.id);
        else if (doc.screens.length > 1) deleteScreen(selection.id);
        return;
      }
      if (e.key.toLowerCase() === "p" && !mod) {
        setShowPreview((v) => !v);
        return;
      }
      if (e.key.startsWith("Arrow") && selection?.type === "part") {
        e.preventDefault();
        const step = (e.shiftKey ? 10 : 1) * 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        update((d) => ({
          ...d,
          parts: d.parts.map((p) => (p.id === selection.id ? { ...p, x: p.x + dx, y: p.y + dy } : p)),
        }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, selection, undo, redo, deletePart, deleteScreen, duplicatePartById, update]);

  if (!doc) {
    return (
      <div className="editor-loading sc-font" data-scheme="light">
        SwiftUI Canvas
      </div>
    );
  }

  const lang: Lang = doc.lang;
  const previewScreenId = activeScreenId ?? doc.screens[0]?.id;

  return (
    <div className="editor sc-font" data-scheme="light">
      <GlassSurface radius={0} refraction={false} className="editor-toolbar">
        <div className="toolbar-inner">
          <span className="toolbar-brand">
            <SfIcon name="sparkles" size={18} />
            {t(lang, "app.name")}
          </span>
          <input
            className="toolbar-title"
            value={doc.title}
            aria-label={t(lang, "inspector.title")}
            onChange={(e) => {
              const value = e.target.value;
              setDoc((prev) => (prev ? { ...prev, title: value } : prev));
            }}
            onBlur={() => {
              /* title edits commit as one step via the next update; the
                 live value is already saved by autosave */
            }}
          />
          <span className="toolbar-sep" />
          <button type="button" className="toolbar-button" onClick={undo} disabled={past.current.length === 0}>
            {t(lang, "toolbar.undo")}
          </button>
          <button type="button" className="toolbar-button" onClick={redo} disabled={future.current.length === 0}>
            {t(lang, "toolbar.redo")}
          </button>
          <button type="button" className="toolbar-button" onClick={addScreen}>
            {t(lang, "toolbar.addScreen")}
          </button>
          <button type="button" className="toolbar-button" onClick={doTidy}>
            {t(lang, "toolbar.tidy")}
          </button>
          <span className="segmented-mini" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                data-selected={lang === l ? "true" : "false"}
                onClick={() => update((d) => ({ ...d, lang: l }))}
              >
                {LANG_NAMES[l]}
              </button>
            ))}
          </span>
          <span className="toolbar-spacer" />
          <button type="button" className="toolbar-button" onClick={saveJson}>
            {t(lang, "toolbar.save")}
          </button>
          <button type="button" className="toolbar-button" onClick={() => fileRef.current?.click()}>
            {t(lang, "toolbar.open")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void openJson(f);
              e.target.value = "";
            }}
          />
          <button type="button" className="toolbar-button" onClick={share}>
            {linkCopied ? t(lang, "toolbar.linkCopied") : t(lang, "toolbar.share")}
          </button>
          <a className="toolbar-button" href="/components">
            {t(lang, "toolbar.components")}
          </a>
          <a className="toolbar-button" href="/glass-lab">
            {t(lang, "toolbar.lab")}
          </a>
          <a className="toolbar-button" href="/compare">
            {t(lang, "toolbar.compare")}
          </a>
          <button type="button" className="toolbar-button" onClick={() => setShowPrompt(true)}>
            {t(lang, "toolbar.prompt")}
          </button>
          <button type="button" className="toolbar-button primary" onClick={() => setShowPreview(true)}>
            {t(lang, "toolbar.preview")}
          </button>
        </div>
      </GlassSurface>

      {warnings.length > 0 ? (
        <div className="warnings-banner sc-font" role="alert">
          <span>
            {t(lang, "warnings.title")} {warnings.join(" · ")}
          </span>
          <button type="button" onClick={() => setWarnings([])}>
            {t(lang, "warnings.dismiss")}
          </button>
        </div>
      ) : null}

      <div className="editor-main">
        <Palette lang={lang} onAdd={(kind) => activeScreenId && addPartToScreen(kind, activeScreenId)} />
        <Canvas
          doc={doc}
          lang={lang}
          selection={selection}
          onSelect={setSelection}
          view={view}
          onViewChange={setView}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onMovePart={movePart}
          onResizePart={resizePart}
          onMoveScreen={moveScreen}
          onDropKind={(kind, screenId, x, y) => addPartToScreen(kind, screenId, x, y)}
          onRenameScreen={(screen: Screen) => setSelection({ type: "screen", id: screen.id })}
        />
        <div className="editor-side">
          <Inspector
            doc={doc}
            lang={lang}
            selection={selection}
            update={update}
            onDuplicateScreen={duplicateScreen}
            onDeleteScreen={deleteScreen}
            onDeletePart={deletePart}
            onDuplicatePart={duplicatePartById}
          />
          <ThemePanel doc={doc} lang={lang} update={update} />
        </div>
      </div>

      {showPrompt ? (
        <PromptPanel doc={doc} screenId={activeScreenId ?? null} onClose={() => setShowPrompt(false)} />
      ) : null}
      {showPreview && previewScreenId ? (
        <Preview doc={doc} initialScreenId={previewScreenId} lang={lang} onClose={() => setShowPreview(false)} />
      ) : null}
    </div>
  );
}
