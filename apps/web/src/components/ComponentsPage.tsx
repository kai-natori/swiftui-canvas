import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";

import {
  LANGS,
  SCREEN_W,
  defaultPart,
  loadDoc,
  newDoc,
  partSize,
  type Doc,
  type Kind,
  type Lang,
  type Part,
} from "@swiftui-canvas/core";
import { GlassSurface } from "@swiftui-canvas/glass";

import {
  CATALOG_CATEGORIES,
  NOT_YET,
  filterCatalog,
  stashPendingPart,
  type CatalogEntry,
  type CategoryId,
} from "~/lib/catalog";
import { KIND_NAMES, LANG_NAMES, t } from "~/lib/i18n";
import { SfIcon } from "~/lib/symbols";
import { SwiftPart, partUi } from "./SwiftPart";

/* The Components catalog (/components).
 *
 * A documentation-style page in the shape of Apple's SwiftUI docs:
 * every part kind rendered live by the same SwiftPart renderer the
 * editor uses, labelled with the SwiftUI view it generates, grouped
 * by Apple's documentation categories (see lib/catalog.ts), plus a
 * coverage section listing SwiftUI views that are not parts yet.
 *
 * Previews are inert showcases: they use default parts in a scratch
 * document that follows the page's language and appearance toggles,
 * never the user's working document.
 */

type Scheme = "light" | "dark";
type Filter = CategoryId | "all";

/** Stage scale: logical 393pt wide, rendered at 0.8 in a ~314pt card. */
const SCALE = 0.8;
const STAGE_PAD = 18;

function initialLang(): Lang {
  try {
    return loadDoc(window.localStorage)?.doc.lang ?? "en";
  } catch {
    return "en";
  }
}

function CatalogCard({
  entry,
  doc,
  lang,
}: {
  entry: CatalogEntry;
  doc: Doc;
  lang: Lang;
}) {
  const screenId = doc.screens[0]?.id ?? "";
  const part: Part = useMemo(() => {
    const p = defaultPart(lang, screenId, entry.kind, 0, 0);
    const w = p.w ?? partSize(entry.kind, p).w;
    return { ...p, x: Math.round((SCREEN_W - w) / 2), y: STAGE_PAD };
  }, [entry.kind, lang, screenId]);

  const size = partSize(entry.kind, part);
  const h = part.h ?? size.h;
  const stageH = h + STAGE_PAD * 2;
  const ui = partUi(doc.theme);

  return (
    <article className="catalog-card" data-scheme={doc.theme.scheme}>
      <div
        className="catalog-stage"
        style={{ height: Math.round(stageH * SCALE) } as CSSProperties}
        aria-hidden="true"
      >
        <div
          className="catalog-stage-inner"
          data-scheme={doc.theme.scheme}
          style={
            {
              width: SCREEN_W,
              height: stageH,
              transform: `translateX(-50%) scale(${SCALE})`,
              "--sc-accent": ui.accent,
            } as CSSProperties
          }
        >
          <div style={{ position: "absolute", left: part.x, top: part.y }}>
            <SwiftPart part={part} doc={doc} ui={ui} />
          </div>
        </div>
      </div>
      <div className="catalog-card-body">
        <div className="catalog-card-head">
          <h3 className="catalog-swift">{entry.swift}</h3>
          {entry.composite ? (
            <span className="catalog-badge">{t(lang, "catalog.composite")}</span>
          ) : null}
        </div>
        <p className="catalog-kind">
          {KIND_NAMES[lang][entry.kind]}
          <span className="catalog-kind-id">{entry.kind}</span>
        </p>
        <p className="catalog-desc">{t(lang, entry.descKey)}</p>
        <Link
          className="catalog-add"
          to="/"
          onClick={() => {
            try {
              stashPendingPart(window.localStorage, entry.kind as Kind);
            } catch {
              /* storage unavailable: the link still opens the editor */
            }
          }}
        >
          <SfIcon name="plus" size={13} />
          {t(lang, "catalog.addToEditor")}
        </Link>
      </div>
    </article>
  );
}

export function ComponentsPage() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [scheme, setScheme] = useState<Scheme>("light");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const doc = useMemo<Doc>(() => {
    const d = newDoc(lang);
    d.theme = { ...d.theme, scheme };
    return d;
  }, [lang, scheme]);

  const visible = useMemo(() => filterCatalog(filter, query), [filter, query]);
  const sections = useMemo(() => {
    if (filter !== "all") {
      const cat = CATALOG_CATEGORIES.find((c) => c.id === filter);
      return cat ? [{ category: cat, entries: visible }] : [];
    }
    return CATALOG_CATEGORIES.map((category) => ({
      category,
      entries: visible.filter((e) => e.category === category.id),
    })).filter((s) => s.entries.length > 0);
  }, [filter, visible]);

  return (
    <div className="catalog-page sc-font" data-scheme={scheme}>
      <GlassSurface radius={0} refraction={false} className="catalog-toolbar">
        <div className="toolbar-inner">
          <span className="toolbar-brand">
            <SfIcon name="sparkles" size={18} />
            {t(lang, "app.name")}
          </span>
          <span className="toolbar-sep" />
          <Link className="toolbar-button" to="/">
            {t(lang, "toolbar.editor")}
          </Link>
          <Link className="toolbar-button" to="/glass-lab">
            {t(lang, "toolbar.lab")}
          </Link>
          <span className="toolbar-spacer" />
          <span className="segmented-mini" role="group" aria-label="Appearance">
            {(["light", "dark"] as Scheme[]).map((s) => (
              <button
                key={s}
                type="button"
                data-selected={scheme === s ? "true" : "false"}
                onClick={() => setScheme(s)}
              >
                {s === "light" ? t(lang, "theme.light") : t(lang, "theme.dark")}
              </button>
            ))}
          </span>
          <span className="segmented-mini" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                data-selected={lang === l ? "true" : "false"}
                onClick={() => setLang(l)}
              >
                {LANG_NAMES[l]}
              </button>
            ))}
          </span>
        </div>
      </GlassSurface>

      <div className="catalog-wrap">
        <header className="catalog-hero">
          <p className="lab-eyebrow">{t(lang, "catalog.eyebrow")}</p>
          <h1 className="catalog-h1">{t(lang, "catalog.title")}</h1>
          <p className="catalog-subtitle">{t(lang, "catalog.subtitle")}</p>
          <div className="catalog-tools">
            <label className="catalog-search">
              <SfIcon name="magnifyingglass" size={15} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(lang, "catalog.searchPlaceholder")}
                aria-label={t(lang, "catalog.searchPlaceholder")}
              />
            </label>
            <span className="catalog-count">
              {visible.length} {t(lang, "catalog.availableCount")}
            </span>
          </div>
          <nav className="catalog-pills" aria-label="Categories">
            <button
              type="button"
              data-active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              {t(lang, "catalog.all")}
            </button>
            {CATALOG_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                data-active={filter === c.id}
                onClick={() => setFilter(c.id)}
              >
                {t(lang, c.nameKey)}
              </button>
            ))}
          </nav>
        </header>

        {visible.length === 0 ? (
          <p className="catalog-empty">{t(lang, "catalog.noResults")}</p>
        ) : (
          sections.map(({ category, entries }) => (
            <section key={category.id} className="catalog-section" aria-label={t(lang, category.nameKey)}>
              <div className="catalog-section-head">
                <h2>{t(lang, category.nameKey)}</h2>
                <span className="catalog-source">{category.source}</span>
              </div>
              <div className="catalog-grid">
                {entries.map((entry) => (
                  <CatalogCard key={entry.kind} entry={entry} doc={doc} lang={lang} />
                ))}
              </div>
            </section>
          ))
        )}

        <section className="catalog-coverage" aria-label={t(lang, "catalog.coverageTitle")}>
          <h2>{t(lang, "catalog.coverageTitle")}</h2>
          <p>{t(lang, "catalog.coverageNote")}</p>
          <div className="catalog-notyet-grid">
            {NOT_YET.map((entry) => (
              <div key={entry.swift} className="catalog-notyet">
                <span className="catalog-notyet-name">{entry.swift}</span>
                <span className="catalog-notyet-cat">
                  {t(lang, CATALOG_CATEGORIES.find((c) => c.id === entry.category)?.nameKey ?? "catalog.all")}
                </span>
                <span className="catalog-badge catalog-badge-muted">{t(lang, "catalog.planned")}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="catalog-footer">{t(lang, "catalog.sourceNote")}</footer>
      </div>
    </div>
  );
}
