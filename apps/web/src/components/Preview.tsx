import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  BACK_TARGET,
  SCREEN_H,
  SCREEN_W,
  isSearchTab,
  type Doc,
  type Lang,
  type Part,
  type Transition,
} from "@swiftui-canvas/core";
import { GlassAlert, GlassSheet } from "@swiftui-canvas/glass";

import { t } from "~/lib/i18n";
import { ScreenView } from "./ScreenView";
import { SfIcon } from "~/lib/symbols";

/* Tap-through preview (preview spec, task 5.1).
 *
 * Navigation state lives here: a stack for push/zoom/none, a modal
 * layer for sheet/cover transitions, and a presentation layer for
 * alert/sheet parts reached through `presents`. Interactive part state
 * (toggle, segmented, tab selection) is kept in a local copy of the
 * document so the editor's document is never mutated by previewing.
 */

const HIDDEN = new Set(["alert", "sheet"]);
const SEARCH_HIDDEN = new Set(["alert", "sheet", "tabBar"]);

interface ModalState {
  screenId: string;
  kind: "sheet" | "cover";
}

export function Preview({
  doc,
  initialScreenId,
  lang,
  onClose,
}: {
  doc: Doc;
  initialScreenId: string;
  lang: Lang;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<Doc>(() => structuredClone(doc));
  const [stack, setStack] = useState<string[]>([initialScreenId]);
  const [lastTransition, setLastTransition] = useState<string>("push");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [presented, setPresented] = useState<Part | null>(null);
  const [scale, setScale] = useState(1);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState<{ query: string; stack: string[]; selections: Record<string, number> } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); previousFocus?.focus(); };
  }, []);

  useEffect(() => {
    const compute = () => {
      setScale(Math.max(0.15, Math.min(1, (window.innerHeight - 136) / SCREEN_H, (window.innerWidth - 48) / SCREEN_W)));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const currentId = stack[stack.length - 1] as string;
  const currentScreen = useMemo(
    () => local.screens.find((s) => s.id === currentId) ?? local.screens[0],
    [local, currentId],
  );
  const modalScreen = modal ? local.screens.find((s) => s.id === modal.screenId) : undefined;

  const patchLocal = (partId: string, p: Partial<Part>) =>
    setLocal((d) => ({ ...d, parts: d.parts.map((x) => (x.id === partId ? { ...x, ...p } : x)) }));
  const setInput = (id: string, value: string) => setInputValues((values) => ({ ...values, [id]: value }));
  useEffect(() => {
    if (search) searchRef.current?.focus();
  }, [!!search]);

  const cancelSearch = () => {
    if (!search) return;
    setStack(search.stack);
    setLocal((d) => ({ ...d, parts: d.parts.map((p) => p.kind === "tabBar" ? { ...p, selected: search.selections[p.id] ?? p.selected } : p) }));
    setSearch(null);
  };

  const goBack = () => {
    if (presented) return setPresented(null);
    if (modal) return setModal(null);
    if (search) return cancelSearch();
    if (stack.length > 1) setStack((s) => s.slice(0, -1));
  };

  const navigate = (target: string, transition: Transition) => {
    if (target === BACK_TARGET) return goBack();
    if (!local.screens.some((s) => s.id === target)) return;
    if (transition === "sheet" || transition === "cover") {
      setModal({ screenId: target, kind: transition });
    } else {
      setLastTransition(String(transition));
      setStack((s) => [...s, target]);
    }
  };

  const handleTap = (part: Part) => {
    if (part.presents) {
      const target = local.parts.find((p) => p.id === part.presents);
      if (target) return setPresented(target);
    }
    // Toggles and similar controls also respond locally in preview.
    if (part.kind === "toggle") patchLocal(part.id, { checked: !part.checked });
    if (part.link) navigate(part.link.target, part.link.transition);
  };

  const handleOptionTap = (part: Part, index: number) => {
    const option = part.options?.[index];
    if (part.kind === "tabBar") {
      if (option && isSearchTab(option)) {
        setSearch({
          query: "", stack: [...stack],
          selections: Object.fromEntries(local.parts.filter((p) => p.kind === "tabBar").map((p) => [p.id, p.selected ?? 0])),
        });
      } else {
        setSearch(null);
      }
      patchLocal(part.id, { selected: index });
      // Tab bars exist per screen; apply the same selection everywhere so
      // switching screens keeps the tab highlight consistent.
      setLocal((d) => ({
        ...d,
        parts: d.parts.map((x) => (x.kind === "tabBar" ? { ...x, selected: index } : x)),
      }));
      if (option?.target && option.target !== currentId && !modal) {
        setStack([option.target]);
      }
      return;
    }
    if (part.kind === "segmented" || part.kind === "picker" || part.kind === "menu") {
      patchLocal(part.id, { selected: index });
    }
    if (option?.target) navigate(option.target, "push");
    if (part.presents) {
      const target = local.parts.find((p) => p.id === part.presents);
      if (target) setPresented(target);
    }
  };

  if (!currentScreen) return null;
  const searchQuery = search?.query.trim().toLocaleLowerCase() ?? "";
  const searchResults = searchQuery ? local.parts
    .filter((p) => p.screen === currentId && ["text", "card", "list", "button", "link", "image"].includes(p.kind))
    .flatMap((p) => p.kind === "list"
      ? (p.options ?? []).map((option, index) => ({ part: p, label: option.label, index }))
      : [{ part: p, label: [p.label, p.supporting].filter(Boolean).join(" — "), index: -1 }])
    .filter((result) => result.label.toLocaleLowerCase().includes(searchQuery)) : [];

  return (
    <dialog ref={dialogRef} className="preview-overlay" aria-label={t(lang, "toolbar.preview")}
      onCancel={(e) => { e.preventDefault(); if (search) cancelSearch(); else onClose(); }}>
      <div className="preview-topbar sc-font">
        <span>
          {(modal || stack.length > 1) && !local.parts.some((p) => p.screen === (modalScreen?.id ?? currentScreen.id) && p.kind === "navBar") ? (
            <button type="button" className="preview-close" onClick={goBack} aria-label={t(lang, "preview.back")}><SfIcon name="chevron.left" size={14} /></button>
          ) : <SfIcon name="play" size={14} />}
          {t(lang, "toolbar.preview")} <span className="preview-screen-name">{modalScreen?.name ?? currentScreen.name}</span>
        </span>
        <button type="button" className="preview-close" onClick={onClose} autoFocus>
          <SfIcon name="xmark" size={14} /> {t(lang, "preview.close")}
        </button>
      </div>
      <div className="preview-scale" style={{ width: SCREEN_W * scale, height: SCREEN_H * scale }}>
        <div
          className="preview-phone"
          data-scheme={local.theme.scheme}
          style={{ transform: `scale(${scale})` }}
        >
          <div key={`${currentScreen.id}-${stack.length}`} className={`preview-screen-anim anim-${lastTransition}`}>
            <ScreenView
              doc={local}
              screen={currentScreen}
              hiddenKinds={search ? SEARCH_HIDDEN : HIDDEN}
              onTap={handleTap}
              onOptionTap={handleOptionTap}
              onChange={patchLocal}
              onInput={setInput}
              inputValues={inputValues}
              canGoBack={stack.length > 1}
              onBack={goBack}
            />
          </div>

          {search ? (
            <div className="preview-search" data-scheme={local.theme.scheme}>
              <section className="preview-search-content" aria-label={t(lang, "tab.search")}>
                <h2>{t(lang, "tab.search")}</h2>
                {!searchQuery ? <p>{t(lang, "tab.searchHint")}</p> : null}
                {searchQuery && !searchResults.length ? <p role="status">{t(lang, "tab.searchEmpty")}</p> : null}
                <div className="preview-search-list" aria-live="polite">
                  {searchResults.map(({ part, label, index }) => {
                    const actionable = index >= 0 ? !!part.options?.[index]?.target : !!(part.link || part.presents);
                    return actionable ? (
                      <button type="button" key={`${part.id}-${index}`} onClick={() => {
                        setSearch(null);
                        if (index >= 0) handleOptionTap(part, index);
                        else handleTap(part);
                      }}><span>{label}</span><SfIcon name="chevron.right" size={15} /></button>
                    ) : <div className="preview-search-result" key={`${part.id}-${index}`}>{label}</div>;
                  })}
                </div>
              </section>
              <div className="preview-search-dock">
                <label className="preview-search-field">
                  <SfIcon name="magnifyingglass" size={21} />
                  <input ref={searchRef} type="search" autoComplete="off" enterKeyHint="search"
                    aria-label={t(lang, "tab.searchHint")} placeholder={t(lang, "tab.search")}
                    value={search.query} onChange={(e) => setSearch((value) => value ? { ...value, query: e.target.value } : value)} />
                </label>
                <button type="button" className="preview-search-cancel" onClick={cancelSearch}>{t(lang, "tab.cancel")}</button>
              </div>
            </div>
          ) : null}

          {modal && modalScreen ? (
            <div className={`preview-modal modal-${modal.kind}`}>
              <ScreenView
                doc={local}
                screen={modalScreen}
                hiddenKinds={HIDDEN}
                onTap={handleTap}
                onOptionTap={handleOptionTap}
                onChange={patchLocal}
                onInput={setInput}
                inputValues={inputValues}
                canGoBack
                onBack={goBack}
              />
            </div>
          ) : null}

          {presented ? (
            <div className="preview-present-backdrop" onClick={() => setPresented(null)}>
              {presented.kind === "alert" ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <GlassAlert
                    title={presented.label}
                    message={presented.supporting}
                    actions={(presented.options ?? []).map((o, i) => ({
                      label: o.label,
                      role: i === 0 ? ("cancel" as const) : ("default" as const),
                    }))}
                    onAction={(i) => {
                      const target = presented.options?.[i]?.target;
                      setPresented(null);
                      if (target) navigate(target, "push");
                    }}
                  />
                </div>
              ) : (
                <div className="preview-sheet-wrap" onClick={(e) => e.stopPropagation()}>
                  <GlassSheet width={SCREEN_W} height={presented.h ?? 260} onClose={() => setPresented(null)} closeLabel={t(lang, "prompt.close")}>
                    <div className="preview-sheet-title">{presented.label}</div>
                    {presented.supporting ? <div className="preview-sheet-body">{presented.supporting}</div> : null}
                  </GlassSheet>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      <p className="preview-footnote sc-font">{t(lang, "preview.hint")}</p>
    </dialog>
  );
}
