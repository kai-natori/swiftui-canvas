import type { CSSProperties, MouseEvent } from "react";

import {
  accentHex,
  partSize,
  variantOf,
  type Doc,
  type Part,
  type Theme,
} from "@swiftui-canvas/core";
import { GlassAlert, GlassSurface } from "@swiftui-canvas/glass";

import { SfIcon } from "~/lib/symbols";

/* SwiftPart — renders one core Part as its iOS counterpart (task: the
 * SwiftPart-style renderer for all 24 kinds). Chrome kinds (navBar,
 * tabBar) are built from the glass package: floating glass buttons and
 * the floating capsule tab bar, per the liquid-glass spec — never a
 * full-width bar with a separator.
 *
 * The component fills the part's box (the parent positions it). In
 * preview mode the tap callbacks fire; in canvas mode it is inert.
 */

export interface PartUi {
  accent: string;
  dark: boolean;
  shape: Theme["shape"];
  font: Theme["font"];
}

export function partUi(theme: Theme): PartUi {
  return {
    accent: accentHex(theme),
    dark: theme.scheme === "dark",
    shape: theme.shape,
    font: theme.font,
  };
}

export function fontStack(font: Theme["font"]): string {
  switch (font) {
    case "rounded":
      return 'ui-rounded, "SF Pro Rounded", -apple-system, "Hiragino Maru Gothic ProN", sans-serif';
    case "serif":
      return 'ui-serif, "New York", "Hiragino Mincho ProN", Georgia, serif';
    case "monospaced":
      return 'ui-monospace, "SF Mono", Menlo, monospace';
    default:
      return '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Hiragino Sans", "Noto Sans JP", sans-serif';
  }
}

export interface SwiftPartProps {
  part: Part;
  doc: Doc;
  ui: PartUi;
  /** Preview mode: fires when the part itself is tapped. */
  onTap?: (part: Part) => void;
  /** Preview mode: fires when an option row/tab of the part is tapped. */
  onOptionTap?: (part: Part, index: number) => void;
  /** Preview mode: a nav bar shows a glass back button when true. */
  canGoBack?: boolean;
  onBack?: () => void;
}

const label = "var(--sc-label)";
const secondary = "var(--sc-secondary-label)";
const fill = "var(--sc-fill)";
const panel = "var(--sc-system-background)";

function buttonRadius(ui: PartUi): number {
  return ui.shape === "capsule" ? 999 : 12;
}

export function SwiftPart(props: SwiftPartProps) {
  const { part, ui } = props;
  const v = variantOf(part);
  const size = partSize(part.kind, part);
  const w = part.w ?? size.w;
  const h = part.h ?? size.h;
  const accent = ui.accent;
  const stop = (e: MouseEvent) => {
    if (props.onTap) {
      e.stopPropagation();
      props.onTap(part);
    }
  };
  const clickable: { onClick?: (e: MouseEvent) => void; style?: CSSProperties } = props.onTap
    ? { onClick: stop, style: { cursor: "pointer" } }
    : {};

  switch (part.kind) {
    case "navBar": {
      const large = v === "large";
      return (
        <div style={{ position: "relative", width: w, height: h, fontFamily: "inherit" }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 44, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ width: 60, display: "flex", justifyContent: "flex-start" }}>
              {props.canGoBack ? (
                <GlassSurface radius={999} width={44} height={44} className="sc-toolbar-button">
                  <button type="button" aria-label="Back" onClick={props.onBack} style={glassBtnInner}>
                    <SfIcon name="chevron.left" size={20} />
                  </button>
                </GlassSurface>
              ) : null}
            </div>
            {!large ? (
              <div style={{ fontSize: 17, fontWeight: 600, color: label, textAlign: "center", flex: 1 }}>{part.label}</div>
            ) : (
              <div style={{ flex: 1 }} />
            )}
            <div style={{ width: 60, display: "flex", justifyContent: "flex-end" }}>
              {part.icon ? (
                <GlassSurface radius={999} width={44} height={44} className="sc-toolbar-button">
                  <button type="button" aria-label={part.icon} onClick={() => props.onTap?.(part)} style={glassBtnInner}>
                    <SfIcon name={part.icon} size={20} />
                  </button>
                </GlassSurface>
              ) : null}
            </div>
          </div>
          {large ? (
            <div style={{ position: "absolute", left: 0, bottom: 4, fontSize: 34, fontWeight: 700, letterSpacing: 0.3, color: label }}>
              {part.label}
            </div>
          ) : null}
        </div>
      );
    }

    case "tabBar": {
      const opts = part.options ?? [];
      const sel = part.selected ?? 0;
      return (
        <GlassSurface radius={999} width={w} height={62} className="sc-tabbar">
          <div style={{ display: "flex", width: "100%", height: "100%", padding: "0 6px", boxSizing: "border-box" }}>
            {opts.map((o, i) => (
              <button
                key={i}
                type="button"
                className="sc-tabbar__item"
                data-selected={i === sel ? "true" : "false"}
                style={{ color: i === sel ? accent : undefined }}
                onClick={() => props.onOptionTap?.(part, i)}
              >
                {o.icon ? (
                  <span className="sc-tabbar__icon">
                    <SfIcon name={o.icon} size={22} />
                  </span>
                ) : null}
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        </GlassSurface>
      );
    }

    case "searchField":
      return (
        <div style={{ width: w, height: h, borderRadius: 10, background: fill, display: "flex", alignItems: "center", gap: 6, padding: "0 10px", color: secondary, fontSize: 17 }}>
          <SfIcon name="magnifyingglass" size={16} />
          <span style={{ color: secondary }}>{part.label}</span>
        </div>
      );

    case "button": {
      if (v === "glass" || v === "glassProminent") {
        return (
          <GlassSurface radius={999} width={w} height={h} className="sc-glass-button" style={v === "glassProminent" ? ({ "--sc-accent": accent } as CSSProperties) : undefined}>
            <button type="button" data-variant={v} onClick={stop} style={{ ...glassBtnInner, width: "100%", height: "100%", fontSize: 17, fontWeight: 600, color: v === "glassProminent" ? "#fff" : label, background: v === "glassProminent" ? `color-mix(in srgb, ${accent} 68%, transparent)` : "transparent", borderRadius: 999, gap: 8 }}>
              {part.icon ? <SfIcon name={part.icon} size={18} /> : null}
              {part.label}
            </button>
          </GlassSurface>
        );
      }
      const style: CSSProperties =
        v === "borderedProminent"
          ? { background: accent, color: "#fff", border: "none" }
          : v === "bordered"
            ? { background: "transparent", color: accent, border: `1.5px solid ${accent}` }
            : v === "plain"
              ? { background: "transparent", color: accent, border: "none" }
              : { background: fill, color: label, border: "none" };
      return (
        <button type="button" onClick={stop} style={{ width: w, height: h, borderRadius: buttonRadius(ui), fontSize: 17, fontWeight: 600, fontFamily: "inherit", cursor: props.onTap ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, ...style }}>
          {part.icon ? <SfIcon name={part.icon} size={18} /> : null}
          {part.label}
        </button>
      );
    }

    case "iconButton": {
      const icon = <SfIcon name={part.icon ?? "plus"} size={20} />;
      if (v === "glass") {
        return (
          <GlassSurface radius={999} width={44} height={44} className="sc-toolbar-button">
            <button type="button" aria-label={part.label || (part.icon ?? "button")} onClick={stop} style={glassBtnInner}>{icon}</button>
          </GlassSurface>
        );
      }
      const style: CSSProperties =
        v === "borderedProminent"
          ? { background: accent, color: "#fff", border: "none" }
          : v === "bordered"
            ? { background: "transparent", color: accent, border: `1.5px solid ${accent}` }
            : { background: "transparent", color: accent, border: "none" };
      return (
        <button type="button" aria-label={part.label || (part.icon ?? "button")} onClick={stop} style={{ width: 44, height: 44, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", cursor: props.onTap ? "pointer" : "default", ...style }}>
          {icon}
        </button>
      );
    }

    case "menu":
      return (
        <button type="button" onClick={stop} style={{ width: w, height: h, borderRadius: buttonRadius(ui), fontSize: 17, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", cursor: props.onTap ? "pointer" : "default", ...(v === "borderedProminent" ? { background: accent, color: "#fff", border: "none" } : v === "glass" ? { background: "var(--sc-glass-tint)", color: label, border: "0.5px solid var(--sc-glass-border)" } : { background: fill, color: label, border: "none" }) }}>
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {part.icon ? <SfIcon name={part.icon} size={17} /> : null}
            {part.label}
          </span>
          <SfIcon name="chevron.up.chevron.down" size={14} />
        </button>
      );

    case "link":
      return (
        <span onClick={stop} style={{ color: accent, fontSize: 17, cursor: props.onTap ? "pointer" : "default", display: "inline-flex", alignItems: "center", height: h }}>
          {part.label}
        </span>
      );

    case "textField":
    case "secureField": {
      const secure = part.kind === "secureField";
      return (
        <div style={{ width: w, height: h, borderRadius: v === "roundedBorder" ? 10 : 0, border: v === "roundedBorder" ? `1px solid var(--sc-separator)` : "none", borderBottom: v === "plain" ? `0.5px solid var(--sc-separator)` : undefined, background: v === "roundedBorder" ? panel : "transparent", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", fontSize: 17 }}>
          {part.icon ? <span style={{ color: secondary, display: "flex" }}><SfIcon name={part.icon} size={17} /></span> : null}
          <span style={{ color: secondary, flex: 1 }}>{secure ? "••••••••" : (part.supporting ?? part.label)}</span>
          {secure ? <span style={{ color: secondary, display: "flex" }}><SfIcon name="eye.slash" size={17} /></span> : null}
        </div>
      );
    }

    case "toggle":
      return (
        <div {...clickable} style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "space-between", ...clickable.style }}>
          <span style={{ fontSize: 17, color: label }}>{part.label}</span>
          <span style={{ width: 51, height: 31, borderRadius: 999, background: part.checked ? "#34C759" : fill, position: "relative", flex: "none", transition: "background .15s" }}>
            <span style={{ position: "absolute", top: 2, left: part.checked ? 22 : 2, width: 27, height: 27, borderRadius: 999, background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,.25)", transition: "left .15s" }} />
          </span>
        </div>
      );

    case "slider": {
      const val = part.value ?? 40;
      return (
        <div style={{ width: w, height: h, display: "flex", alignItems: "center", position: "relative" }}>
          <div style={{ height: 4, borderRadius: 2, background: fill, width: "100%" }} />
          <div style={{ height: 4, borderRadius: 2, background: accent, width: `${val}%`, position: "absolute", left: 0 }} />
          <div style={{ position: "absolute", left: `calc(${val}% - 14px)`, width: 28, height: 28, borderRadius: 999, background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.3)" }} />
        </div>
      );
    }

    case "gauge": {
      const value = Math.min(1, Math.max(0, part.value ?? 0.65));
      const percent = Math.round(value * 100);
      if (v === "accessoryCircular") return (
        <div style={{ width: w, height: h, display: "grid", placeItems: "center", color: label }}>
          <div style={{ position: "relative", width: 64, height: 64 }}>
            <svg viewBox="0 0 64 64" width="64" height="64" aria-label={part.label}>
              <circle cx="32" cy="32" r="27" fill="none" stroke={fill} strokeWidth="6" strokeDasharray="127 170" transform="rotate(135 32 32)" />
              <circle cx="32" cy="32" r="27" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${value * 127} 170`} transform="rotate(135 32 32)" />
            </svg>
            <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 20, fontWeight: 600 }}>{percent}</span>
          </div>
          <span style={{ fontSize: 11 }}>{part.label}</span>
        </div>
      );
      return (
        <div style={{ width: w, height: h, color: label, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}><span>{part.label}</span><span>{percent}%</span></div>
          <div style={{ height: 7, borderRadius: 999, background: fill, overflow: "hidden" }}><div style={{ width: `${percent}%`, height: "100%", background: accent, borderRadius: 999 }} /></div>
        </div>
      );
    }
    case "datePicker": {
      const date = new Date(part.date ?? "2026-11-21T09:41");
      const locale = props.doc.lang === "ja" ? "ja-JP" : props.doc.lang === "zh" ? "zh-CN" : "en-US";
      const components = part.displayedComponents ?? "both";
      const chip: CSSProperties = { background: fill, borderRadius: 7, padding: "7px 9px", fontSize: 15, whiteSpace: "nowrap" };
      return (
        <div style={{ width: w, height: h, display: "flex", alignItems: "center", gap: 6, color: label }}>
          <span style={{ fontSize: 17, flex: 1 }}>{part.label}</span>
          {components !== "time" ? <span style={chip}>{date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}</span> : null}
          {components !== "date" ? <span style={chip}>{date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}</span> : null}
        </div>
      );
    }
    case "colorPicker":
      return (
        <div style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "space-between", color: label, fontSize: 17 }}>
          <span>{part.label}</span>
          <span style={{ width: 30, height: 30, padding: 3, borderRadius: "50%", background: "conic-gradient(red, #ff0, #0f0, cyan, blue, magenta, red)", boxSizing: "border-box" }}>
            <span style={{ display: "block", width: "100%", height: "100%", borderRadius: "50%", background: part.color ?? "#007AFF", border: "2px solid white", boxSizing: "border-box" }} />
          </span>
        </div>
      );
    case "stepper":
      return (
        <div style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 17, color: label }}>{part.label}: {part.value ?? 1}</span>
          <span style={{ display: "flex", background: fill, borderRadius: 8, overflow: "hidden", height: 32 }}>
            <span style={stepperBtn}>−</span>
            <span style={{ width: 0.5, background: "var(--sc-separator)" }} />
            <span style={stepperBtn}>+</span>
          </span>
        </div>
      );

    case "segmented": {
      const opts = part.options ?? [];
      const sel = part.selected ?? 0;
      return (
        <div style={{ width: w, height: h, borderRadius: 9, background: fill, display: "flex", padding: 2, boxSizing: "border-box" }}>
          {opts.map((o, i) => (
            <button key={i} type="button" onClick={() => props.onOptionTap?.(part, i)} style={{ flex: 1, border: "none", borderRadius: 7, fontSize: 13, fontWeight: i === sel ? 600 : 400, fontFamily: "inherit", cursor: props.onOptionTap ? "pointer" : "default", background: i === sel ? panel : "transparent", color: label, boxShadow: i === sel ? "0 1px 4px rgba(0,0,0,.15)" : "none" }}>
              {o.label}
            </button>
          ))}
        </div>
      );
    }

    case "picker": {
      const opts = part.options ?? [];
      const sel = part.selected ?? 0;
      return (
        <div style={{ width: w, height: h, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 17, color: label }}>{part.label}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, background: fill, borderRadius: 8, padding: "6px 10px", fontSize: 15, color: secondary }}>
            {opts[sel]?.label ?? ""}
            <SfIcon name="chevron.up.chevron.down" size={12} />
          </span>
        </div>
      );
    }

    case "text": {
      const sizes: Record<string, [number, number]> = {
        largeTitle: [34, 700], title: [28, 700], headline: [17, 600], body: [17, 400],
        callout: [16, 400], footnote: [13, 400], caption: [12, 400],
      };
      const [fs, fw] = sizes[v] ?? [17, 400];
      return <div style={{ width: w, minHeight: h, fontSize: fs, fontWeight: fw, color: label, lineHeight: 1.25, letterSpacing: fs >= 28 ? 0.3 : 0 }}>{part.label}</div>;
    }

    case "image":
      return (
        <div style={{ width: w, height: h, borderRadius: 12, background: "linear-gradient(140deg,#8ec5fc 0%,#a18cd1 55%,#fbc2eb 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.9)" }}>
          <SfIcon name={part.icon ?? "photo"} size={40} />
        </div>
      );

    case "list": {
      const opts = part.options ?? [];
      const inset = v === "insetGrouped";
      return (
        <div style={{ width: w, height: h, background: inset ? panel : "transparent", borderRadius: inset ? 12 : 0, overflow: "hidden" }}>
          {opts.map((o, i) => (
            <div key={i} onClick={() => props.onOptionTap?.(part, i)} style={{ height: 44, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", position: "relative", cursor: props.onOptionTap ? "pointer" : "default" }}>
              {i > 0 ? <div style={{ position: "absolute", left: inset && o.icon ? 48 : 16, right: 0, top: 0, height: 0.5, background: "var(--sc-separator)" }} /> : null}
              {o.icon ? <span style={{ color: accent, display: "flex" }}><SfIcon name={o.icon} size={20} /></span> : null}
              <span style={{ fontSize: 17, color: label, flex: 1 }}>{o.label}</span>
              <span style={{ color: secondary, display: "flex" }}><SfIcon name="chevron.right" size={14} /></span>
            </div>
          ))}
        </div>
      );
    }

    case "card":
      return (
        <div {...clickable} style={{ width: w, height: h, borderRadius: 14, background: v === "filled" ? panel : "transparent", border: v === "stroke" ? `1px solid var(--sc-separator)` : "none", boxShadow: v === "filled" ? "0 1px 3px rgba(0,0,0,.08)" : "none", padding: 14, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 6, overflow: "hidden", ...clickable.style }}>
          {part.icon ? <span style={{ color: accent, display: "flex" }}><SfIcon name={part.icon} size={26} /></span> : null}
          <div style={{ fontSize: 17, fontWeight: 600, color: label }}>{part.label}</div>
          {part.supporting ? <div style={{ fontSize: 13, color: secondary, lineHeight: 1.35 }}>{part.supporting}</div> : null}
        </div>
      );

    case "divider":
      return <div style={{ width: w, height: 1, background: "var(--sc-separator)" }} />;

    case "progress": {
      const val = part.value ?? 40;
      if (v === "circular") {
        const r = 18;
        const c = 2 * Math.PI * r;
        return (
          <svg width={44} height={44} viewBox="0 0 44 44">
            <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" stroke={fill} />
            <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" stroke={accent} strokeLinecap="round" strokeDasharray={`${(val / 100) * c} ${c}`} transform="rotate(-90 22 22)" />
          </svg>
        );
      }
      return (
        <div style={{ width: w, height: 6, borderRadius: 3, background: fill, overflow: "hidden", alignSelf: "center" }}>
          <div style={{ width: `${val}%`, height: "100%", background: accent, borderRadius: 3 }} />
        </div>
      );
    }

    case "alert":
      return (
        <GlassAlert
          title={part.label}
          message={part.supporting}
          width={w}
          actions={(part.options ?? []).map((o, i) => ({
            label: o.label,
            role: i === 0 ? ("cancel" as const) : ("default" as const),
          }))}
          onAction={props.onTap ? () => props.onTap?.(part) : undefined}
        />
      );

    case "sheet":
      return (
        <div style={{ width: w, height: h, borderRadius: "28px 28px 0 0", background: panel, boxShadow: "0 -8px 32px rgba(0,0,0,.18)", padding: "8px 20px", boxSizing: "border-box" }}>
          <div style={{ width: 36, height: 5, borderRadius: 3, background: "var(--sc-tertiary-label)", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: label }}>{part.label}</div>
          {part.supporting ? <div style={{ fontSize: 15, color: secondary, marginTop: 6, lineHeight: 1.4 }}>{part.supporting}</div> : null}
        </div>
      );

    case "box": {
      const bg = v === "secondary" ? "var(--sc-secondary-background)" : v === "tertiary" ? fill : panel;
      return <div style={{ width: w, height: h, borderRadius: 12, background: bg, border: v === "background" ? `0.5px solid var(--sc-separator)` : "none" }} />;
    }

    case "contentUnavailable":
      return (
        <div style={{ width: w, height: h, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center", padding: 16, boxSizing: "border-box" }}>
          <span style={{ color: secondary, display: "flex" }}><SfIcon name={part.icon ?? "tray"} size={44} /></span>
          <div style={{ fontSize: 20, fontWeight: 600, color: label }}>{part.label}</div>
          {part.supporting ? <div style={{ fontSize: 15, color: secondary, lineHeight: 1.35 }}>{part.supporting}</div> : null}
        </div>
      );
  }
}

const glassBtnInner: CSSProperties = {
  all: "unset",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  cursor: "pointer",
  borderRadius: 999,
  color: "var(--sc-label)",
};

const stepperBtn: CSSProperties = {
  width: 46,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  color: "var(--sc-label)",
};
