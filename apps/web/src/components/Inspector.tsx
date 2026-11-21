import { useState } from "react";
import {
  BACK_TARGET,
  KIND_VARIANTS,
  partSize,
  SCREEN_BGS,
  TRANSITIONS,
  partsOf,
  variantOf,
  isSearchTab,
  type Doc,
  type Lang,
  type Transition,
  type Part,
  type Screen,
} from "@swiftui-canvas/core";

import { KIND_NAMES, TRANSITION_NAMES, VARIANT_NAMES, t } from "~/lib/i18n";
import { SYMBOL_NAMES, SfIcon } from "~/lib/symbols";
import type { Selection } from "./Canvas";
import { movePartDoc } from "~/lib/editor-logic";

/* Inspector (task 4.3) — Xcode-preview-style property editing for the
 * selected part, screen, or (with no selection) the document. All
 * mutations go through `update`, which the Editor records in history.
 */

export interface InspectorProps {
  doc: Doc;
  lang: Lang;
  selection: Selection;
  update: (fn: (doc: Doc) => Doc) => void;
  onDuplicateScreen: (id: string) => void;
  onDeleteScreen: (id: string) => void;
  onDeletePart: (id: string) => void;
  onDuplicatePart: (id: string) => void;
}

const ICON_KINDS = new Set(["button", "iconButton", "menu", "textField", "image", "card", "contentUnavailable", "navBar"]);
const OPTION_KINDS = new Set(["segmented", "picker", "menu", "tabBar", "list", "alert", "disclosure"]);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="inspector-field">
      <span className="inspector-field-label">{label}</span>
      {children}
    </label>
  );
}

export function Inspector(props: InspectorProps) {
  const { doc, lang, selection, update } = props;
  const part = selection?.type === "part" ? doc.parts.find((p) => p.id === selection.id) : undefined;
  const screen = selection?.type === "screen" ? doc.screens.find((s) => s.id === selection.id) : undefined;

  if (part) return <PartInspector {...props} part={part} />;
  if (screen) return <ScreenInspector {...props} screen={screen} />;
  return (
    <div className="inspector sc-font">
      <div className="panel-title">{t(lang, "inspector.document")}</div>
      <Field label={t(lang, "inspector.title")}>
        <input
          className="inspector-input"
          value={doc.title}
          onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
        />
      </Field>
      <p className="inspector-meta">
        {doc.screens.length} {t(lang, "inspector.screens")} · {doc.parts.length} {t(lang, "inspector.parts")}
      </p>
      <p className="inspector-hint">{t(lang, "inspector.selectHint")}</p>
    </div>
  );
}

function PartInspector(props: InspectorProps & { part: Part }) {
  const { doc, lang, part, update } = props;
  const patch = (p: Partial<Part>) => update((d) => {
    const moved = p.x !== undefined || p.y !== undefined ? movePartDoc(d, part.id, p.x ?? part.x, p.y ?? part.y) : d;
    return { ...moved, parts: moved.parts.map((x) => (x.id === part.id ? { ...x, ...p } : x)) };
  });
  const screens = doc.screens;
  const presentables = part.screen
    ? partsOf(doc, part.screen).filter((p) => (p.kind === "alert" || p.kind === "sheet") && p.id !== part.id)
    : [];
  const hasOptions = OPTION_KINDS.has(part.kind) || part.options !== undefined;

  return (
    <div className="inspector sc-font">
      <div className="panel-title">
        {t(lang, "inspector.part")} · {KIND_NAMES[lang][part.kind]}
      </div>

      <Field label={t(lang, "inspector.label")}>
        <input className="inspector-input" value={part.label} onChange={(e) => patch({ label: e.target.value })} />
      </Field>

      {part.kind === "image" ? <ImageField key={part.id} part={part} lang={lang} onChange={(image) => patch({ image })} /> : null}
      {part.kind === "box" ? <p className="inspector-hint">{t(lang, "container.hint")}</p> : null}
      {!["box", "navBar", "tabBar", "sheet", "alert"].includes(part.kind) && doc.parts.some((p) => p.screen === part.screen && p.kind === "box") ? (
        <Field label={t(lang, "container.parent")}>
          <select className="inspector-select" aria-label={t(lang, "container.parent")} value={part.parent ?? ""} onChange={(e) => {
            const parent = doc.parts.find((p) => p.id === e.target.value);
            patch({ parent: parent?.id, ...(parent ? { x: parent.x + 16, y: parent.y + 16 } : {}) });
          }}>
            <option value="">{t(lang, "inspector.none")}</option>
            {doc.parts.filter((p) => p.kind === "box" && p.screen === part.screen).map((p) => <option key={p.id} value={p.id}>{p.label || t(lang, "container.parent")}</option>)}
          </select>
        </Field>
      ) : null}

      {(part.kind === "card" || part.kind === "alert" || part.kind === "sheet" || part.kind === "contentUnavailable" || part.kind === "textField" || part.kind === "secureField") ? (
        <Field label={t(lang, "inspector.supporting")}>
          <input
            className="inspector-input"
            value={part.supporting ?? ""}
            onChange={(e) => patch({ supporting: e.target.value || undefined })}
          />
        </Field>
      ) : null}

      {ICON_KINDS.has(part.kind) ? (
        <Field label={t(lang, "inspector.icon")}>
          <span className="inspector-icon-row">
            <span className="inspector-icon-preview">
              <SfIcon name={part.icon || "minus"} size={18} />
            </span>
            <select
              className="inspector-select"
              value={part.icon ?? ""}
              onChange={(e) => patch({ icon: e.target.value || null })}
            >
              <option value="">{t(lang, "inspector.none")}</option>
              {part.icon && !SYMBOL_NAMES.includes(part.icon) ? <option value={part.icon}>{part.icon}</option> : null}
              {SYMBOL_NAMES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </span>
        </Field>
      ) : null}

      <Field label={t(lang, "inspector.variant")}>
        <select
          className="inspector-select"
          value={variantOf(part)}
          onChange={(e) => {
            const variant = e.target.value as Part["variant"];
            patch({ variant, ...(part.kind === "gauge" ? partSize(part.kind, { variant }) : {}) });
          }}
        >
          {KIND_VARIANTS[part.kind].map((v) => (
            <option key={v} value={v}>{VARIANT_NAMES[lang][v] ?? v}</option>
          ))}
        </select>
      </Field>

      {part.kind === "toggle" ? (
        <Field label={t(lang, "inspector.checked")}>
          <input type="checkbox" checked={part.checked ?? false} onChange={(e) => patch({ checked: e.target.checked })} />
        </Field>
      ) : null}

      {part.kind === "datePicker" ? (
        <>
          <Field label={t(lang, "inspector.displayedComponents")}>
            <select className="inspector-select" value={part.displayedComponents ?? "both"} onChange={(e) => patch({ displayedComponents: e.target.value as Part["displayedComponents"] })}>
              {(["date", "time", "both"] as const).map((c) => <option key={c} value={c}>{t(lang, `inspector.${c}`)}</option>)}
            </select>
          </Field>
          <Field label={t(lang, "inspector.both")}>
            <input className="inspector-input" type="datetime-local" value={part.date ?? "2026-11-21T09:41"} onChange={(e) => patch({ date: e.target.value || undefined })} />
          </Field>
        </>
      ) : null}
      {part.kind === "colorPicker" ? (
        <Field label={t(lang, "inspector.color")}>
          <input type="color" value={part.color ?? "#007AFF"} onChange={(e) => patch({ color: e.target.value })} />
        </Field>
      ) : null}
      {part.kind === "slider" || part.kind === "progress" || part.kind === "stepper" || part.kind === "gauge" ? (
        <Field label={`${t(lang, "inspector.value")} (${part.value ?? 0})`}>
          <input
            type="range"
            min={0}
            max={part.kind === "gauge" ? 1 : part.kind === "stepper" ? 20 : 100}
            step={part.kind === "gauge" ? 0.01 : 1}
            value={part.value ?? 0}
            onChange={(e) => patch({ value: Number(e.target.value) })}
          />
        </Field>
      ) : null}

      {hasOptions && part.options ? (
        <div className="inspector-section">
          <div className="inspector-section-title">{t(lang, "inspector.options")}</div>
          {(part.kind === "segmented" || part.kind === "picker" || part.kind === "menu" || part.kind === "tabBar") ? (
            <Field label={t(lang, "inspector.selected")}>
              <select
                className="inspector-select"
                value={part.selected ?? 0}
                onChange={(e) => patch({ selected: Number(e.target.value) })}
              >
                {part.options.map((o, i) => (
                  <option key={i} value={i}>{o.label || `#${i + 1}`}</option>
                ))}
              </select>
            </Field>
          ) : null}
          {part.options.map((o, i) => (
            <div key={i} className="inspector-option">
              {part.kind === "tabBar" ? <select className="inspector-select" aria-label={t(lang, "tab.role")}
                value={isSearchTab(o) ? "search" : "default"} onChange={(e) => patch({
                  options: part.options?.map((option, index) => index === i ? { ...option, role: e.target.value as "default" | "search" } : option),
                })}>
                <option value="default">{t(lang, "tab.default")}</option>
                <option value="search">{t(lang, "tab.search")}</option>
              </select> : null}
              <input
                className="inspector-input"
                aria-label={t(lang, "inspector.optionLabel")}
                value={o.label}
                onChange={(e) =>
                  patch({ options: part.options?.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })
                }
              />
              <select
                className="inspector-select inspector-option-icon"
                aria-label={t(lang, "inspector.icon")}
                value={o.icon ?? ""}
                onChange={(e) =>
                  patch({ options: part.options?.map((x, j) => (j === i ? { ...x, icon: e.target.value || null } : x)) })
                }
              >
                <option value="">—</option>
                {SYMBOL_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <select
                className="inspector-select"
                aria-label={t(lang, "inspector.optionTarget")}
                value={o.target ?? ""}
                onChange={(e) =>
                  patch({ options: part.options?.map((x, j) => (j === i ? { ...x, target: e.target.value || null } : x)) })
                }
              >
                <option value="">{t(lang, "inspector.none")}</option>
                {screens.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="inspector-mini"
                onClick={() => patch({ options: part.options?.filter((_, j) => j !== i) })}
              >
                {t(lang, "inspector.removeOption")}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="inspector-add"
            onClick={() => patch({ options: [...(part.options ?? []), { label: "" }] })}
          >
            {t(lang, "inspector.addOption")}
          </button>
        </div>
      ) : null}

      <div className="inspector-section">
        <div className="inspector-section-title">{t(lang, "inspector.link")}</div>
        <Field label={t(lang, "inspector.linkTarget")}>
          <select
            className="inspector-select"
            value={part.link?.target ?? ""}
            onChange={(e) => {
              const target = e.target.value;
              patch({
                link: target ? { target, transition: part.link?.transition ?? "push" } : undefined,
              });
            }}
          >
            <option value="">{t(lang, "inspector.none")}</option>
            <option value={BACK_TARGET}>{t(lang, "inspector.back")}</option>
            {screens.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </Field>
        {part.link ? (
          <Field label={t(lang, "inspector.transition")}>
            <select
              className="inspector-select"
              value={part.link.transition}
              onChange={(e) => part.link && patch({ link: { target: part.link.target, transition: e.target.value as Transition } })}
            >
              {TRANSITIONS.map((tr) => (
                <option key={tr} value={tr}>{TRANSITION_NAMES[lang][tr]}</option>
              ))}
            </select>
          </Field>
        ) : null}
        {presentables.length > 0 ? (
          <Field label={t(lang, "inspector.presents")}>
            <select
              className="inspector-select"
              value={part.presents ?? ""}
              onChange={(e) => patch({ presents: e.target.value || undefined })}
            >
              <option value="">{t(lang, "inspector.none")}</option>
              {presentables.map((p) => (
                <option key={p.id} value={p.id}>{KIND_NAMES[lang][p.kind]}: {p.label}</option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>

      <Field label={t(lang, "inspector.note")}>
        <textarea
          className="inspector-input"
          rows={2}
          value={part.note ?? ""}
          onChange={(e) => patch({ note: e.target.value || undefined })}
        />
      </Field>

      <div className="inspector-section">
        <div className="inspector-section-title">{t(lang, "inspector.position")}</div>
        <div className="inspector-xyzw">
          {(["x", "y", "w", "h"] as const).map((k) => (
            <label key={k} className="inspector-num">
              <span>{k}</span>
              <input
                type="number"
                value={Math.round(part[k] ?? (k === "w" || k === "h" ? partSize(part.kind, part)[k] : 0))}
                min={k === "w" || k === "h" ? 1 : undefined}
                onChange={(e) => patch({ [k]: k === "w" || k === "h" ? Math.max(1, Number(e.target.value)) : Number(e.target.value) })}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="inspector-actions">
        <button type="button" className="inspector-add" onClick={() => props.onDuplicatePart(part.id)}>
          {t(lang, "inspector.duplicate")}
        </button>
        <button type="button" className="inspector-add danger" onClick={() => props.onDeletePart(part.id)}>
          {t(lang, "inspector.delete")}
        </button>
      </div>
    </div>
  );
}

function ImageField({ part, lang, onChange }: { part: Part; lang: Lang; onChange: (value: string | undefined) => void }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const load = async (file: File) => {
    setError(false);
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type) || file.size > 10_000_000) {
      setError(true);
      return;
    }
    setLoading(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const image = canvas.toDataURL("image/webp", 0.85);
      if (image.length > 2_000_000) throw new Error("Image too large");
      onChange(image);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="image-field">
      {part.image ? <img src={part.image} alt={part.label} width={220} height={100} /> : null}
      <label className="inspector-add image-upload">
        {loading ? t(lang, "image.loading") : t(lang, "image.upload")}
        <input type="file" aria-label={t(lang, "image.upload")} accept="image/png,image/jpeg,image/webp,image/gif" disabled={loading}
          onChange={(e) => { const file = e.target.files?.[0]; if (file) void load(file); e.target.value = ""; }} />
      </label>
      {part.image ? <button type="button" className="inspector-add" onClick={() => onChange(undefined)}>{t(lang, "image.remove")}</button> : null}
      {error ? <p className="field-error" role="alert">{t(lang, "image.error")}</p> : null}
    </div>
  );
}

function ScreenInspector(props: InspectorProps & { screen: Screen }) {
  const { doc, lang, screen, update } = props;
  const patch = (p: Partial<Screen>) => update((d) => ({ ...d, screens: d.screens.map((x) => (x.id === screen.id ? { ...x, ...p } : x)) }));
  const bgValue = SCREEN_BGS.includes((screen.bg ?? "system") as never) ? (screen.bg ?? "system") : "custom";
  return (
    <div className="inspector sc-font">
      <div className="panel-title">{t(lang, "inspector.screen")}</div>
      <Field label={t(lang, "inspector.name")}>
        <input className="inspector-input" value={screen.name} onChange={(e) => patch({ name: e.target.value })} />
      </Field>
      <Field label={t(lang, "inspector.background")}>
        <span className="inspector-icon-row">
          <select
            className="inspector-select"
            value={bgValue}
            onChange={(e) => {
              if (e.target.value !== "custom") patch({ bg: e.target.value });
            }}
          >
            <option value="system">{t(lang, "bg.system")}</option>
            <option value="secondary">{t(lang, "bg.secondary")}</option>
            <option value="grouped">{t(lang, "bg.grouped")}</option>
            <option value="custom">{t(lang, "theme.custom")}</option>
          </select>
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(screen.bg ?? "") ? (screen.bg as string) : "#FFFFFF"}
            onChange={(e) => patch({ bg: e.target.value })}
            aria-label={t(lang, "inspector.background")}
          />
        </span>
      </Field>
      <Field label={t(lang, "inspector.chrome")}>
        <input type="checkbox" checked={screen.chrome} onChange={(e) => patch({ chrome: e.target.checked })} />
      </Field>
      <Field label={t(lang, "inspector.note")}>
        <textarea
          className="inspector-input"
          rows={2}
          value={screen.note ?? ""}
          onChange={(e) => patch({ note: e.target.value || undefined })}
        />
      </Field>
      <p className="inspector-meta">
        {partsOf(doc, screen.id).length} {t(lang, "inspector.parts")}
      </p>
      <div className="inspector-actions">
        <button type="button" className="inspector-add" onClick={() => props.onDuplicateScreen(screen.id)}>
          {t(lang, "inspector.duplicate")}
        </button>
        <button
          type="button"
          className="inspector-add danger"
          disabled={doc.screens.length <= 1}
          onClick={() => props.onDeleteScreen(screen.id)}
        >
          {t(lang, "inspector.delete")}
        </button>
      </div>
    </div>
  );
}
