import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  LANGS,
  MAX_PROJECT_BYTES,
  SHARE_PREFIX,
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

import { takePendingPart } from "~/lib/catalog";
import { autoPlacePart, duplicateScreenDoc, existingChrome, movePartDoc, snap, tidyScreen } from "~/lib/editor-logic";
import { LANG_NAMES, t } from "~/lib/i18n";
import { SfIcon } from "~/lib/symbols";
import { Canvas, type Selection, type View } from "./Canvas";
import { Inspector } from "./Inspector";
import { Palette } from "./Palette";
import { Preview } from "./Preview";
import { PromptPanel } from "./PromptPanel";
import { ThemePanel } from "./ThemePanel";
import { Navigator } from "./Navigator";

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
  const [panel, setPanel] = useState<"navigator" | "inspector" | null>(null);
  const [inspectorTab, setInspectorTab] = useState<"properties" | "appearance">("properties");
  const [saveError, setSaveError] = useState(false);
  const [notice, setNotice] = useState("");
  const [viewport, setViewport] = useState({ compact: false, narrow: false });
  const past = useRef<Doc[]>([]);
  const future = useRef<Doc[]>([]);
  const dragSnapshot = useRef<Doc | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [, setHistoryTick] = useState(0);
  const overlayPanel = panel === "navigator" ? viewport.compact : panel === "inspector" && viewport.narrow;

  useEffect(() => {
    const updateViewport = () => setViewport({ compact: window.innerWidth <= 760, narrow: window.innerWidth <= 1100 });
    updateViewport();
    window.addEventListener("resize", updateViewport);
    const closeMenu = (event: PointerEvent) => {
      const menu = document.querySelector<HTMLDetailsElement>(".workspace-menu[open]");
      if (menu && !menu.contains(event.target as Node)) menu.open = false;
    };
    window.addEventListener("pointerdown", closeMenu);
    return () => {
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("pointerdown", closeMenu);
    };
  }, []);

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
      let saved: ReturnType<typeof loadDoc> = null;
      try { saved = loadDoc(window.localStorage); } catch { setSaveError(true); }
      const language = saved?.doc.lang ?? (navigator.language.startsWith("ja") ? "ja" : navigator.language.startsWith("zh") ? "zh" : "en");
      if (window.location.hash.startsWith(SHARE_PREFIX)) setNotice(t(language, "workspace.invalidShare"));
      if (saved) {
        setDoc(saved.doc);
        if (saved.warnings.length > 0) setWarnings(saved.warnings);
        return;
      }
      setDoc(newDoc(language));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- autosave ------------------------------------------------------ */
  useEffect(() => {
    if (!doc) return;
    try { saveDoc(window.localStorage, doc); setSaveError(false); } catch { setSaveError(true); }
    document.documentElement.lang = doc.lang;
  }, [doc]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!panel) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const element = overlayPanel ? document.querySelector<HTMLElement>(panel === "navigator" ? ".workspace-sidebar" : ".editor-side") : null;
    element?.querySelector<HTMLButtonElement>("button")?.focus();
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setPanel(null); }
      if (e.key === "Tab" && element) {
        const items = Array.from(element.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]")).filter((item) => item.getClientRects().length > 0);
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("keydown", close); if (element) previousFocus?.focus(); };
  }, [panel, overlayPanel]);

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
    setDoc((prev) => prev ? movePartDoc(prev, partId, x, y) : prev);
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
      const existing = existingChrome(doc, screenId, kind);
      if (existing) {
        setSelection({ type: "part", id: existing.id });
        setNotice(t(doc.lang, "workspace.chromeExists"));
        setInspectorTab("properties");
        setPanel(null);
        return;
      }
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
      setInspectorTab("properties");
      setPanel(null);
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
        parts: d.parts.filter((p) => p.screen !== id).map((p) => ({
          ...p,
          link: p.link?.target === id ? undefined : p.link,
          options: p.options?.map((o) => o.target === id ? { ...o, target: null } : o),
        })),
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
          .map((p) => ({ ...p, presents: p.presents === id ? undefined : p.presents, parent: p.parent === id ? undefined : p.parent })),
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
      if (part.kind === "navBar" || part.kind === "tabBar") {
        setNotice(t(doc.lang, "workspace.chromeExists"));
        return;
      }
      const copy = duplicatePart(part);
      copy.x = snap(part.x + 16);
      copy.y = snap(part.y + 16);
      copy.presents = undefined;
      const children = doc.parts.filter((p) => p.parent === id).map((p) => ({
        ...duplicatePart(p), parent: copy.id, x: p.x + copy.x - part.x, y: p.y + copy.y - part.y,
      }));
      update((d) => ({ ...d, parts: [...d.parts, copy, ...children] }));
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
      if (file.size > MAX_PROJECT_BYTES) {
        setNotice(t(doc?.lang ?? "en", "workspace.openTooLarge"));
        return;
      }
      try {
        const parsed = parseProjectFile(await file.text());
        if (!parsed) throw new Error("Invalid project");
        commit(parsed.doc);
        setSelection(null);
        setWarnings(parsed.warnings);
      } catch {
        setNotice(t(doc?.lang ?? "en", "workspace.openError"));
      }
    },
    [commit, doc?.lang],
  );

  const share = useCallback(async () => {
    if (!doc) return;
    try {
      const link = await shareLink(doc, `${window.location.origin}${window.location.pathname}`);
      try { await navigator.clipboard.writeText(link); }
      catch { window.prompt(t(doc.lang, "toolbar.share"), link); }
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1600);
    } catch {
      setNotice(t(doc.lang, "workspace.shareError"));
    }
  }, [doc]);

  /* ---- keyboard -------------------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showPreview || showPrompt || overlayPanel) return;
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
        update((d) => {
          const p = d.parts.find((part) => part.id === selection.id);
          return p ? movePartDoc(d, p.id, p.x + dx, p.y + dy) : d;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, selection, undo, redo, deletePart, deleteScreen, duplicatePartById, update, showPreview, showPrompt, overlayPanel]);

  if (!doc) {
    return (
      <div className="editor-loading sc-font" data-scheme="light">
        SwiftUI Canvas
      </div>
    );
  }

  const lang: Lang = doc.lang;
  const previewScreenId = activeScreenId ?? doc.screens[0]?.id;
  const activeScreen = doc.screens.find((screen) => screen.id === activeScreenId);
  const selectFromNavigator = (next: Selection) => {
    setSelection(next);
    setInspectorTab("properties");
    const screenId = next?.type === "screen" ? next.id : doc.parts.find((p) => p.id === next?.id)?.screen;
    const screen = doc.screens.find((s) => s.id === screenId);
    const bounds = document.querySelector(".canvas-host")?.getBoundingClientRect();
    if (screen && bounds) setView((v) => ({ ...v, x: bounds.width / 2 - (screen.x + 393 / 2) * v.k, y: bounds.height / 2 - (screen.y + 852 / 2) * v.k }));
  };

  return (
    <div className="editor sc-font" data-scheme="light" data-panel={panel ?? ""}>
      <header className="workspace-toolbar" inert={!!overlayPanel}>
        <div className="workspace-brand">
          <span className="workspace-logo"><SfIcon name="square.stack" size={20} /></span>
          <div><strong>SwiftUI Canvas</strong><span className="development-label" title={t(lang, "workspace.developmentHint")}>{t(lang, "workspace.development")}</span></div>
          <details className="workspace-menu">
            <summary aria-label={t(lang, "workspace.file")} title={t(lang, "workspace.file")}><SfIcon name="chevron.down" size={13} /></summary>
            <div className="workspace-menu-content" onClick={(e) => {
              if ((e.target as HTMLElement).closest("button, a")) e.currentTarget.closest("details")?.removeAttribute("open");
            }}>
              <button type="button" onClick={saveJson}><SfIcon name="doc.text" size={15} />{t(lang, "toolbar.save")}</button>
              <button type="button" onClick={() => fileRef.current?.click()}><SfIcon name="folder" size={15} />{t(lang, "toolbar.open")}</button>
              <button type="button" onClick={share}><SfIcon name="square.and.arrow.up" size={15} />{linkCopied ? t(lang, "toolbar.linkCopied") : t(lang, "toolbar.share")}</button>
              <label>{t(lang, "workspace.language")}<select value={lang} onChange={(e) => update((d) => ({ ...d, lang: e.target.value as Lang }))}>
                {LANGS.map((l) => <option value={l} key={l}>{LANG_NAMES[l]}</option>)}
              </select></label>
              <Link to="/components">{t(lang, "toolbar.components")}<SfIcon name="arrow.up.right" size={12} /></Link>
              <Link to="/glass-lab">{t(lang, "toolbar.lab")}<SfIcon name="arrow.up.right" size={12} /></Link>
              <Link to="/compare">{t(lang, "toolbar.compare")}<SfIcon name="arrow.up.right" size={12} /></Link>
            </div>
          </details>
        </div>
        <div className="workspace-history">
          <button type="button" className="tool-icon" title={`${t(lang, "toolbar.undo")} (⌘Z)`} aria-label={t(lang, "toolbar.undo")} onClick={undo} disabled={past.current.length === 0}><SfIcon name="arrow.uturn.backward" size={18} /></button>
          <button type="button" className="tool-icon" title={`${t(lang, "toolbar.redo")} (⇧⌘Z)`} aria-label={t(lang, "toolbar.redo")} onClick={redo} disabled={future.current.length === 0}><SfIcon name="arrow.uturn.forward" size={18} /></button>
        </div>
        <div className="workspace-document">
          <input
            className="toolbar-title"
            value={doc.title}
            aria-label={t(lang, "inspector.title")}
            onChange={(e) => {
              const value = e.target.value;
              update((prev) => ({ ...prev, title: value }));
            }}
          />
          <span><SfIcon name="rectangle.portrait" size={12} /> iPhone <span className="document-separator">/</span> iOS 26</span>
        </div>
        <div className="workspace-actions">
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
          <button type="button" className="tool-icon share-button" onClick={share} aria-label={linkCopied ? t(lang, "toolbar.linkCopied") : t(lang, "toolbar.share")} title={t(lang, "toolbar.share")}>
            <SfIcon name={linkCopied ? "checkmark" : "square.and.arrow.up"} size={18} />
          </button>
          <button type="button" className="toolbar-button" aria-label={t(lang, "toolbar.prompt")} title={t(lang, "toolbar.prompt")} onClick={() => setShowPrompt(true)}>
            <SfIcon name="curlybraces" size={16} /><span>{t(lang, "toolbar.prompt")}</span>
          </button>
          <button type="button" className="toolbar-button primary" aria-label={t(lang, "toolbar.preview")} title={t(lang, "toolbar.preview")} onClick={() => setShowPreview(true)}>
            <SfIcon name="play" size={13} /><span>{t(lang, "toolbar.preview")}</span>
          </button>
        </div>
      </header>
      <div className="workspace-bar" inert={!!overlayPanel}>
        <button type="button" className="panel-toggle" aria-expanded={viewport.compact ? panel === "navigator" : panel !== "navigator"} onClick={() => setPanel(panel === "navigator" ? null : "navigator")}>
          <SfIcon name="sidebar.left" size={17} />{t(lang, "workspace.navigator")}
        </button>
        <div className="workspace-breadcrumb"><SfIcon name="square.stack" size={13} /><span>{doc.title}</span><SfIcon name="chevron.right" size={10} /><strong>{activeScreen?.name}</strong></div>
        <button type="button" className="panel-toggle" aria-expanded={viewport.narrow ? panel === "inspector" : panel !== "inspector"} onClick={() => setPanel(panel === "inspector" ? null : "inspector")}>
          {t(lang, "workspace.inspector")}<SfIcon name="sidebar.right" size={17} />
        </button>
      </div>

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
        {panel ? <button type="button" className="panel-scrim" aria-label={t(lang, "prompt.close")} onClick={() => setPanel(null)} /> : null}
        <aside className="workspace-sidebar" inert={!!overlayPanel && panel !== "navigator"}>
          <div className="panel-mobile-head">{t(lang, "workspace.navigator")}<button type="button" aria-label={t(lang, "prompt.close")} onClick={() => setPanel(null)}><SfIcon name="xmark" size={16} /></button></div>
          <Navigator doc={doc} lang={lang} selection={selection} onSelect={selectFromNavigator} />
          <Palette lang={lang} onAdd={(kind) => activeScreenId && addPartToScreen(kind, activeScreenId)} />
        </aside>
        <main className="canvas-column" inert={!!overlayPanel}>
          <div className="canvas-heading">
            <span><SfIcon name="rectangle.portrait" size={14} />393 × 852 <span className="canvas-unit">pt</span></span>
            <div>
              <button type="button" onClick={doTidy}><SfIcon name="slider.horizontal.3" size={14} />{t(lang, "toolbar.tidy")}</button>
              <button type="button" onClick={addScreen}><SfIcon name="plus" size={14} />{t(lang, "toolbar.addScreen")}</button>
            </div>
          </div>
        <Canvas
          doc={doc}
          lang={lang}
          selection={selection}
          onSelect={(next) => { setSelection(next); setInspectorTab("properties"); }}
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
        </main>
        <aside className="editor-side" inert={!!overlayPanel && panel !== "inspector"}>
          <div className="panel-mobile-head">{t(lang, "workspace.inspector")}<button type="button" aria-label={t(lang, "prompt.close")} onClick={() => setPanel(null)}><SfIcon name="xmark" size={16} /></button></div>
          <div className="inspector-tabs" role="group" aria-label={t(lang, "workspace.inspector")}>
            <button type="button" aria-pressed={inspectorTab === "properties"} onClick={() => setInspectorTab("properties")}>{t(lang, "workspace.properties")}</button>
            <button type="button" aria-pressed={inspectorTab === "appearance"} onClick={() => setInspectorTab("appearance")}>{t(lang, "workspace.appearance")}</button>
          </div>
          <div className="inspector-scroll">
          {inspectorTab === "properties" ?
          <Inspector
            doc={doc}
            lang={lang}
            selection={selection}
            update={update}
            onDuplicateScreen={duplicateScreen}
            onDeleteScreen={deleteScreen}
            onDeletePart={deletePart}
            onDuplicatePart={duplicatePartById}
          /> :
          <ThemePanel doc={doc} lang={lang} update={update} />}
          </div>
        </aside>
      </div>
      <footer className="workspace-status">
        <span className={saveError ? "save-error" : ""}><SfIcon name={saveError ? "exclamationmark.triangle" : "checkmark"} size={12} />{t(lang, saveError ? "workspace.saveError" : "workspace.saved")}</span>
        <span className="workspace-shortcuts">{t(lang, "workspace.hint")}</span>
        <span>{doc.screens.length} {t(lang, "inspector.screens")} · {doc.parts.length} {t(lang, "inspector.parts")}</span>
      </footer>
      {notice ? <div className="workspace-notice" role="status">{notice}</div> : null}

      {showPrompt ? (
        <PromptPanel doc={doc} screenId={activeScreenId ?? null} onClose={() => setShowPrompt(false)} />
      ) : null}
      {showPreview && previewScreenId ? (
        <Preview doc={doc} initialScreenId={previewScreenId} lang={lang} onClose={() => setShowPreview(false)} />
      ) : null}
    </div>
  );
}
