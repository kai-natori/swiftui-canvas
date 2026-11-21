import { useLayoutEffect, useMemo, useRef, useState } from "react";

import { LANGS, type Doc, type Lang } from "@swiftui-canvas/core";
import { buildPrompt } from "@swiftui-canvas/prompt";

import { LANG_NAMES, t } from "~/lib/i18n";

/* Prompt panel (task 6.3): language switch, whole-document or
 * single-screen scope, and copy to clipboard, over packages/prompt. */

export function PromptPanel({
  doc,
  screenId,
  onClose,
}: {
  doc: Doc;
  screenId: string | null;
  onClose: () => void;
}) {
  const [lang, setLang] = useState<Lang>(doc.lang);
  const [scope, setScope] = useState<"whole" | "screen">(screenId ? "screen" : "whole");
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); previousFocus?.focus(); };
  }, []);
  const uiLang = doc.lang;

  const prompt = useMemo(
    () => buildPrompt(doc, { lang, screenId: scope === "screen" ? (screenId ?? undefined) : undefined }),
    [doc, lang, scope, screenId],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.querySelector<HTMLTextAreaElement>(".prompt-text");
      ta?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <dialog ref={dialogRef} className="prompt-overlay" aria-label={t(uiLang, "prompt.title")}
      onCancel={(e) => { e.preventDefault(); onClose(); }}>
      <div className="prompt-panel">
        <div className="prompt-head sc-font">
          <span className="prompt-title">{t(uiLang, "prompt.title")}</span>
          <span className="segmented-mini" role="group" aria-label={t(uiLang, "prompt.language")}>
            {LANGS.map((l) => (
              <button key={l} type="button" data-selected={lang === l ? "true" : "false"} onClick={() => setLang(l)}>
                {LANG_NAMES[l]}
              </button>
            ))}
          </span>
          <span className="segmented-mini" role="group">
            <button type="button" data-selected={scope === "whole" ? "true" : "false"} onClick={() => setScope("whole")}>
              {t(uiLang, "prompt.whole")}
            </button>
            <button
              type="button"
              data-selected={scope === "screen" ? "true" : "false"}
              disabled={!screenId}
              onClick={() => setScope("screen")}
            >
              {t(uiLang, "prompt.screen")}
            </button>
          </span>
          <span className="prompt-head-spacer" />
          <button type="button" className="toolbar-button primary" onClick={copy}>
            {copied ? t(uiLang, "prompt.copied") : t(uiLang, "prompt.copy")}
          </button>
          <button type="button" className="toolbar-button" onClick={onClose}>
            {t(uiLang, "prompt.close")}
          </button>
        </div>
        <textarea className="prompt-text" aria-label={t(uiLang, "prompt.title")} readOnly value={prompt} />
      </div>
    </dialog>
  );
}
