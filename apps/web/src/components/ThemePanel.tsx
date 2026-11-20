import { ACCENT_PRESETS, type Doc, type Lang, type Theme } from "@swiftui-canvas/core";

import { t } from "~/lib/i18n";

/* Theme panel (task 4.7): accent presets + custom hex, appearance,
 * shape and font design — the same Theme the prompt describes. */

export function ThemePanel({ doc, lang, update }: { doc: Doc; lang: Lang; update: (fn: (d: Doc) => Doc) => void }) {
  const theme = doc.theme;
  const patch = (p: Partial<Theme>) => update((d) => ({ ...d, theme: { ...d.theme, ...p } }));
  return (
    <div className="theme-panel sc-font">
      <div className="panel-title">{t(lang, "theme.title")}</div>
      <div className="inspector-field">
        <span className="inspector-field-label">{t(lang, "theme.accent")}</span>
        <span className="accent-row">
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className="accent-swatch"
              data-selected={theme.accent === p.key ? "true" : "false"}
              style={{ background: p.hex }}
              aria-label={p.key}
              onClick={() => patch({ accent: p.key })}
            />
          ))}
          <input
            type="color"
            aria-label={t(lang, "theme.custom")}
            value={/^#[0-9a-fA-F]{6}$/.test(theme.accent) ? theme.accent : "#007AFF"}
            onChange={(e) => patch({ accent: e.target.value })}
          />
        </span>
      </div>
      <div className="inspector-field">
        <span className="inspector-field-label">{t(lang, "theme.scheme")}</span>
        <span className="segmented-mini">
          {(["light", "dark"] as const).map((s) => (
            <button key={s} type="button" data-selected={theme.scheme === s ? "true" : "false"} onClick={() => patch({ scheme: s })}>
              {t(lang, s === "light" ? "theme.light" : "theme.dark")}
            </button>
          ))}
        </span>
      </div>
      <div className="inspector-field">
        <span className="inspector-field-label">{t(lang, "theme.shape")}</span>
        <span className="segmented-mini">
          {(["default", "capsule"] as const).map((s) => (
            <button key={s} type="button" data-selected={theme.shape === s ? "true" : "false"} onClick={() => patch({ shape: s })}>
              {t(lang, s === "default" ? "theme.shapeDefault" : "theme.shapeCapsule")}
            </button>
          ))}
        </span>
      </div>
      <label className="inspector-field">
        <span className="inspector-field-label">{t(lang, "theme.font")}</span>
        <select className="inspector-select" value={theme.font} onChange={(e) => patch({ font: e.target.value as Theme["font"] })}>
          <option value="system">{t(lang, "theme.fontSystem")}</option>
          <option value="rounded">{t(lang, "theme.fontRounded")}</option>
          <option value="serif">{t(lang, "theme.fontSerif")}</option>
          <option value="monospaced">{t(lang, "theme.fontMono")}</option>
        </select>
      </label>
    </div>
  );
}
