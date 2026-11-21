import type { Doc, Lang } from "@swiftui-canvas/core";
import { KIND_NAMES, t } from "~/lib/i18n";
import { SfIcon } from "~/lib/symbols";
import type { Selection } from "./Canvas";
import { KIND_ICONS } from "./Palette";

export function Navigator({ doc, lang, selection, onSelect }: {
  doc: Doc; lang: Lang; selection: Selection; onSelect: (selection: Selection) => void;
}) {
  return (
    <nav className="navigator-tree" aria-label={t(lang, "workspace.navigator")}>
      <div className="navigator-heading">{t(lang, "inspector.screens")}<span>{doc.screens.length}</span></div>
      {doc.screens.map((screen) => (
        <div key={screen.id} className="navigator-screen">
          <button type="button" className="navigator-row screen-row"
            aria-pressed={selection?.type === "screen" && selection.id === screen.id}
            onClick={() => onSelect({ type: "screen", id: screen.id })}>
            <SfIcon name="chevron.down" size={10} /><SfIcon name="rectangle.portrait" size={15} />
            <span>{screen.name}</span>
          </button>
          {doc.parts.filter((part) => part.screen === screen.id).map((part) => (
            <button type="button" key={part.id} className="navigator-row layer-row"
              data-nested={!!part.parent}
              aria-pressed={selection?.type === "part" && selection.id === part.id}
              onClick={() => onSelect({ type: "part", id: part.id })}>
              <SfIcon name={KIND_ICONS[part.kind]} size={14} />
              <span>{part.label || KIND_NAMES[lang][part.kind]}</span>
              <span className="layer-kind">{KIND_NAMES[lang][part.kind]}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
