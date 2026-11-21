import type { Part } from "@swiftui-canvas/core";

import { t } from "~/lib/i18n";
import { SfIcon } from "~/lib/symbols";
import type { SwiftPartProps } from "./SwiftPart";

export const INTERACTIVE_KINDS = new Set([
  "textField", "secureField", "searchField", "toggle", "slider",
  "stepper", "picker", "menu", "datePicker", "colorPicker",
]);

/** Native controls keep keyboard, touch, and assistive technology behavior.
 * All state belongs to Preview, never the saved design. */
export function InteractivePart(props: SwiftPartProps & { width: number; height: number }) {
  const { part, width, height, doc, ui, onChange, onInput, inputValue = "" } = props;
  const change = (patch: Partial<Part>) => onChange?.(part.id, patch);
  const input = (value: string) => onInput?.(part.id, value);
  const label = part.label || part.kind;
  const style = { width, minHeight: height, "--part-accent": ui.accent } as React.CSSProperties;

  switch (part.kind) {
    case "searchField":
    case "textField":
    case "secureField":
      return (
        <label className={`native-field ${part.kind === "searchField" ? "native-search" : ""}`} data-variant={part.variant} style={style}>
          {part.kind === "searchField" || part.icon ? <SfIcon name={part.kind === "searchField" ? "magnifyingglass" : part.icon} size={18} /> : null}
          <input
            aria-label={label}
            type={part.kind === "secureField" ? "password" : part.kind === "searchField" ? "search" : "text"}
            value={inputValue}
            placeholder={part.supporting || part.label}
            autoComplete="off"
            onChange={(e) => input(e.target.value)}
          />
        </label>
      );
    case "toggle":
      return (
        <button type="button" className="native-toggle" style={style} role="switch" aria-checked={!!part.checked}
          onClick={() => props.onTap?.(part)}>
          <span>{part.label}</span><span className="native-switch" data-on={!!part.checked}><span /></span>
        </button>
      );
    case "slider":
      return <input className="native-range" style={{ ...style, "--range-fill": `${part.value ?? 40}%` } as React.CSSProperties} aria-label={label} type="range" min={0} max={100}
        value={part.value ?? 40} onChange={(e) => change({ value: Number(e.target.value) })} />;
    case "stepper":
      return (
        <div className="native-row" style={style}>
          <span>{part.label}: <output aria-live="polite">{part.value ?? 1}</output></span>
          <span className="native-stepper">
            <button type="button" aria-label={`${t(doc.lang, "control.decrease")} ${label}`} disabled={(part.value ?? 1) <= 0}
              onClick={() => change({ value: Math.max(0, (part.value ?? 1) - 1) })}>−</button>
            <button type="button" aria-label={`${t(doc.lang, "control.increase")} ${label}`} disabled={(part.value ?? 1) >= 20}
              onClick={() => change({ value: Math.min(20, (part.value ?? 1) + 1) })}>+</button>
          </span>
        </div>
      );
    case "picker":
      return (
        <label className="native-row" style={style}><span>{part.label}</span>
          <select aria-label={label} value={part.selected ?? 0}
            onChange={(e) => props.onOptionTap?.(part, Number(e.target.value))}>
            {part.options?.map((option, index) => <option key={index} value={index}>{option.label}</option>)}
          </select>
        </label>
      );
    case "menu":
      return (
        <details className="native-menu" style={style} data-variant={part.variant} data-up={part.y > 500} onKeyDown={(e) => {
          if (e.key === "Escape" && e.currentTarget.open) { e.preventDefault(); e.stopPropagation(); e.currentTarget.open = false; }
        }}>
          <summary>{part.label}<SfIcon name="chevron.down" size={14} /></summary>
          <div className="native-menu-options">
            {part.options?.map((option, index) => (
              <button type="button" key={index} onClick={(e) => {
                e.currentTarget.closest("details")?.removeAttribute("open");
                props.onOptionTap?.(part, index);
              }}>
                {index === (part.selected ?? 0) || option.icon ? <SfIcon name={index === (part.selected ?? 0) ? "checkmark" : option.icon} size={16} /> : <span style={{ width: 16 }} />}
                {option.label}
              </button>
            ))}
          </div>
        </details>
      );
    case "datePicker": {
      const [date = "2026-11-21", time = "09:41"] = (part.date ?? "2026-11-21T09:41").split("T");
      return (
        <div className="native-row native-date" style={style}><span>{part.label}</span>
          {part.displayedComponents !== "time" ? <input type="date" aria-label={`${label} ${t(doc.lang, "inspector.date")}`}
            value={date} onChange={(e) => { if (e.target.value) change({ date: `${e.target.value}T${time}` }); }} /> : null}
          {part.displayedComponents !== "date" ? <input type="time" aria-label={`${label} ${t(doc.lang, "inspector.time")}`}
            value={time} onChange={(e) => { if (e.target.value) change({ date: `${date}T${e.target.value}` }); }} /> : null}
        </div>
      );
    }
    case "colorPicker":
      return <label className="native-row" style={style}><span>{part.label}</span>
        <input type="color" aria-label={label} value={part.color ?? "#007aff"} onChange={(e) => change({ color: e.target.value })} />
      </label>;
    default:
      return null;
  }
}
