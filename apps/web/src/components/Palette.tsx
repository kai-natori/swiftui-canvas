import { useState } from "react";
import { type Kind, type Lang } from "@swiftui-canvas/core";

import { KIND_NAMES, t } from "~/lib/i18n";
import { SfIcon } from "~/lib/symbols";

/* Parts palette (task 4.2): grouped kinds; drag onto a screen (HTML5
 * drag, the canvas reads the drop point) or click to add to the active
 * screen. Mini icons are SF Symbol lookalikes via the mapping. */

const GROUPS: { key: "palette.bars" | "palette.controls" | "palette.input" | "palette.display" | "palette.modal"; kinds: Kind[] }[] = [
  { key: "palette.bars", kinds: ["navBar", "tabBar", "searchField"] },
  { key: "palette.controls", kinds: ["button", "iconButton", "menu", "link", "segmented", "picker", "stepper"] },
  { key: "palette.input", kinds: ["textField", "secureField", "toggle", "slider", "gauge", "datePicker", "colorPicker"] },
  { key: "palette.display", kinds: ["text", "image", "list", "card", "divider", "progress", "box", "contentUnavailable"] },
  { key: "palette.modal", kinds: ["alert", "sheet"] },
];

export const KIND_ICONS: Record<Kind, string> = {
  gauge: "gauge", datePicker: "calendar", colorPicker: "pencil",
  navBar: "text.bubble", tabBar: "square.grid.2x2", searchField: "magnifyingglass",
  button: "play", iconButton: "plus", menu: "ellipsis.circle", link: "link",
  textField: "text.bubble", secureField: "lock", toggle: "slider.horizontal.3",
  slider: "slider.horizontal.3", stepper: "plus", segmented: "square.grid.2x2",
  picker: "chevron.up.chevron.down", text: "text.bubble", image: "photo",
  list: "list.bullet", card: "doc.text", divider: "minus", progress: "gauge",
  alert: "exclamationmark.triangle", sheet: "doc.text", box: "square.grid.2x2",
  contentUnavailable: "tray",
};

export function Palette({ lang, onAdd }: { lang: Lang; onAdd: (kind: Kind) => void }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const groups = GROUPS.map((group) => ({ ...group, kinds: group.kinds.filter((kind) =>
    `${KIND_NAMES[lang][kind]} ${kind}`.toLocaleLowerCase().includes(query),
  ) })).filter((group) => group.kinds.length);
  return (
    <section className="palette sc-font" aria-label={t(lang, "workspace.library")}>
      <div className="library-heading"><span>{t(lang, "workspace.library")}</span><span>27</span></div>
      <label className="library-search">
        <SfIcon name="magnifyingglass" size={14} />
        <input type="search" aria-label={t(lang, "catalog.searchPlaceholder")} placeholder={t(lang, "catalog.searchPlaceholder")}
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>
      <div className="palette-scroll">
      {groups.map((g) => (
        <div key={g.key} className="palette-group">
          <div className="palette-group-title">{t(lang, g.key)}</div>
          {g.kinds.map((kind) => (
            <button
              key={kind}
              type="button"
              className="palette-item"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/x-sc-kind", kind);
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => onAdd(kind)}
              title={KIND_NAMES[lang][kind]}
            >
              <span className="palette-item-icon">
                <SfIcon name={KIND_ICONS[kind]} size={17} />
              </span>
              <span className="palette-item-name">{KIND_NAMES[lang][kind]}</span>
              <SfIcon name="plus" size={12} />
            </button>
          ))}
        </div>
      ))}
      {groups.length === 0 ? <p className="inspector-hint">{t(lang, "catalog.noResults")}</p> : null}
      </div>
    </section>
  );
}
