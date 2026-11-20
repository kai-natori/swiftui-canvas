import { useEffect, useMemo, useState } from "react";

import {
  BACK_TARGET,
  SCREEN_H,
  SCREEN_W,
  type Doc,
  type Lang,
  type Part,
  type Transition,
} from "@swiftui-canvas/core";
import { GlassAlert, GlassSheet } from "@swiftui-canvas/glass";

import { t } from "~/lib/i18n";
import { ScreenView } from "./ScreenView";

/* Tap-through preview (preview spec, task 5.1).
 *
 * Navigation state lives here: a stack for push/zoom/none, a modal
 * layer for sheet/cover transitions, and a presentation layer for
 * alert/sheet parts reached through `presents`. Interactive part state
 * (toggle, segmented, tab selection) is kept in a local copy of the
 * document so the editor's document is never mutated by previewing.
 */

const HIDDEN = new Set(["alert", "sheet"]);

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

  useEffect(() => {
    const compute = () => {
      setScale(Math.min(1, (window.innerHeight - 48) / (SCREEN_H + 24), (window.innerWidth - 48) / (SCREEN_W + 24)));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const currentId = stack[stack.length - 1] as string;
  const currentScreen = useMemo(
    () => local.screens.find((s) => s.id === currentId) ?? local.screens[0],
    [local, currentId],
  );
  const modalScreen = modal ? local.screens.find((s) => s.id === modal.screenId) : undefined;

  const patchLocal = (partId: string, p: Partial<Part>) =>
    setLocal((d) => ({ ...d, parts: d.parts.map((x) => (x.id === partId ? { ...x, ...p } : x)) }));

  const goBack = () => {
    if (presented) return setPresented(null);
    if (modal) return setModal(null);
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

  return (
    <div className="preview-overlay" role="dialog" aria-label={t(lang, "toolbar.preview")}>
      <button type="button" className="preview-close sc-font" onClick={onClose}>
        {t(lang, "preview.close")}
      </button>
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
              hiddenKinds={HIDDEN}
              onTap={handleTap}
              onOptionTap={handleOptionTap}
              canGoBack={stack.length > 1}
              onBack={goBack}
            />
          </div>

          {modal && modalScreen ? (
            <div className={`preview-modal modal-${modal.kind}`}>
              <ScreenView
                doc={local}
                screen={modalScreen}
                hiddenKinds={HIDDEN}
                onTap={handleTap}
                onOptionTap={handleOptionTap}
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
    </div>
  );
}
