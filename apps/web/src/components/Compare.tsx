import {
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";

import {
  LANGS,
  accentHex,
  defaultPart,
  loadDoc,
  newDoc,
  type Lang,
  type Part,
} from "@swiftui-canvas/core";
import { GlassButton, GlassSurface, GlassTabBar } from "@swiftui-canvas/glass";
import {
  GlassButton as ZGlassButton,
  GlassCard as ZGlassCard,
  GlassNav as ZGlassNav,
  GlassSegmented as ZGlassSegmented,
  GlassSlider as ZGlassSlider,
  GlassSwitch as ZGlassSwitch,
} from "@zakisheriff/liquid-glass";
import "@zakisheriff/liquid-glass/styles.css";
import { LANG_NAMES, t, type StringKey } from "~/lib/i18n";
import { LiquidButton, LiquidGlass } from "~/lib/ozcan";
import { SfIcon } from "~/lib/symbols";
import { GearIcon, HeartIcon, HouseIcon, SearchIcon } from "./icons";
import { SwiftPart, partUi } from "./SwiftPart";

/* Glass comparison (/compare) — an evaluation page, nothing here feeds
 * the editor. One demo scene (card, toggle, segmented, slider, two
 * buttons, floating tab bar) is built three times over the Glass Lab's
 * hero backdrop:
 *
 *   A. Ours — packages/glass + the SwiftPart control renders.
 *   B. @zakisheriff/liquid-glass — its own controls throughout.
 *   C. @ozcanyldzhn/liquid-glass-js — Web Components. It ships surfaces
 *      only (glass / button / card), so its switch, segmented control
 *      and slider are plain controls over its glass surface; that is
 *      the library's real shape, stated on the page, not hidden.
 *
 * Both libraries are imported only from this module, so they land in
 * this route's lazy chunk and the editor never pays for them.
 */

type Scheme = "light" | "dark";

const CONTENT_W = 361;

function initialLang(): Lang {
  try {
    return loadDoc(window.localStorage)?.doc.lang ?? "en";
  } catch {
    return "en";
  }
}

const TAB_ICONS = [
  { key: "compare.tab.home", icon: <HouseIcon size={24} /> },
  { key: "compare.tab.search", icon: <SearchIcon size={24} /> },
  { key: "compare.tab.saved", icon: <HeartIcon size={24} /> },
  { key: "compare.tab.settings", icon: <GearIcon size={24} /> },
] as const;

/** Shared stage: the lab's hero gradient as a full-bleed backdrop, the
 *  scene content in a column, the tab bar floating at the bottom. */
function Stage({
  scheme,
  children,
  tabBar,
}: {
  scheme: Scheme;
  children: ReactNode;
  tabBar: ReactNode;
}) {
  return (
    <div className="cmp-stage" data-scheme={scheme}>
      <div className="cmp-stage-bg" aria-hidden="true" />
      <div className="cmp-stage-content">{children}</div>
      <div className="cmp-tabbar-slot">{tabBar}</div>
      <div className="home-indicator" aria-hidden="true" />
    </div>
  );
}

function SceneHeading({ lang }: { lang: Lang }) {
  return (
    <div>
      <p className="cmp-kicker">{t(lang, "compare.demo.kicker")}</p>
      <h2 className="cmp-h2">{t(lang, "compare.demo.title")}</h2>
    </div>
  );
}

/* ---------------- A. Ours (packages/glass + SwiftPart) ---------------- */

function SceneOurs({ lang, scheme }: { lang: Lang; scheme: Scheme }) {
  const [tab, setTab] = useState(0);
  const [on, setOn] = useState(true);
  const [seg, setSeg] = useState(1);
  const [value, setValue] = useState(55);

  const doc = useMemo(() => {
    const d = newDoc(lang);
    d.theme = { ...d.theme, scheme };
    return d;
  }, [lang, scheme]);
  const ui = partUi(doc.theme);
  const screenId = doc.screens[0]?.id ?? null;
  const accent = accentHex(doc.theme);

  const togglePart: Part = useMemo(
    () => ({ ...defaultPart(lang, screenId, "toggle", 0, 0), checked: on }),
    [lang, screenId, on],
  );
  const segmentedPart: Part = useMemo(
    () => ({
      ...defaultPart(lang, screenId, "segmented", 0, 0),
      options: [t(lang, "compare.demo.segA"), t(lang, "compare.demo.segB"), t(lang, "compare.demo.segC")].map(
        (label) => ({ label }),
      ),
      selected: seg,
    }),
    [lang, screenId, seg],
  );
  const sliderPart: Part = useMemo(
    () => ({ ...defaultPart(lang, screenId, "slider", 0, 0), value }),
    [lang, screenId, value],
  );

  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderFromPointer = (e: ReactPointerEvent) => {
    const r = sliderRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    setValue(Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))));
  };

  return (
    <Stage
      scheme={scheme}
      tabBar={
        <GlassTabBar
          items={TAB_ICONS.map((tabDef, i) => ({
            id: String(i),
            label: t(lang, tabDef.key as StringKey),
            icon: tabDef.icon,
          }))}
          selectedId={String(tab)}
          onSelect={(id) => setTab(Number(id))}
        />
      }
    >
      <SceneHeading lang={lang} />
      <GlassSurface radius={24} width={CONTENT_W} height={104}>
        <div className="cmp-card-body">
          <p className="cmp-card-title">{t(lang, "compare.demo.cardTitle")}</p>
          <p className="cmp-card-text">{t(lang, "compare.demo.cardText")}</p>
        </div>
      </GlassSurface>

      <SwiftPart part={togglePart} doc={doc} ui={ui} onTap={() => setOn((v) => !v)} />
      <SwiftPart part={segmentedPart} doc={doc} ui={ui} onOptionTap={(_p, i) => setSeg(i)} />
      <div>
        <p className="cmp-slider-label" data-ours="true">
          {t(lang, "compare.demo.slider")}
        </p>
        <div
          ref={sliderRef}
          className="cmp-slider-hit"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            sliderFromPointer(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) sliderFromPointer(e);
          }}
        >
          <SwiftPart part={sliderPart} doc={doc} ui={ui} />
        </div>
      </div>

      <div className="cmp-stack">
        <GlassButton variant="glassProminent" accent={accent} onClick={() => setOn((v) => !v)}>
          {t(lang, "compare.demo.primary")}
        </GlassButton>
        <GlassButton variant="glass" onClick={() => setTab(1)}>
          {t(lang, "compare.demo.secondary")}
        </GlassButton>
      </div>
    </Stage>
  );
}

/* ---------------- B. @zakisheriff/liquid-glass ---------------- */

function SceneZaki({ lang, scheme }: { lang: Lang; scheme: Scheme }) {
  const [tab, setTab] = useState(0);
  const [on, setOn] = useState(true);
  const [seg, setSeg] = useState(1);
  const [value, setValue] = useState(55);
  const segLabels = [t(lang, "compare.demo.segA"), t(lang, "compare.demo.segB"), t(lang, "compare.demo.segC")];

  return (
    <Stage
      scheme={scheme}
      tabBar={
        <div data-theme={scheme} style={{ width: CONTENT_W }}>
          <ZGlassNav
            items={TAB_ICONS.map((tabDef) => ({
              label: t(lang, tabDef.key as StringKey),
              icon: tabDef.icon,
              activeIcon: tabDef.icon,
            }))}
            activeIndex={tab}
            onChange={setTab}
            aria-label="Tabs"
          />
        </div>
      }
    >
      <SceneHeading lang={lang} />
      <div data-theme={scheme}>
        <ZGlassCard radius="24px" padding="16px 18px">
          <p className="cmp-card-title">{t(lang, "compare.demo.cardTitle")}</p>
          <p className="cmp-card-text">{t(lang, "compare.demo.cardText")}</p>
        </ZGlassCard>
      </div>

      <div className="cmp-row" data-theme={scheme}>
        <span className="cmp-row-label">{t(lang, "compare.demo.toggle")}</span>
        <ZGlassSwitch checked={on} onChange={setOn} aria-label={t(lang, "compare.demo.toggle")} />
      </div>

      <div data-theme={scheme}>
        <ZGlassSegmented
          options={segLabels}
          value={seg}
          onChange={setSeg}
          aria-label="Range"
          style={{ width: "100%" }}
        />
      </div>

      <div data-theme={scheme}>
        <p className="cmp-slider-label">{t(lang, "compare.demo.slider")}</p>
        <ZGlassSlider value={value} onChange={setValue} aria-label={t(lang, "compare.demo.slider")} />
      </div>

      <div className="cmp-stack" data-theme={scheme}>
        <ZGlassButton variant="filled" tint="#007AFF" size="lg" style={{ width: "100%" }} onClick={() => setOn((v) => !v)}>
          {t(lang, "compare.demo.primary")}
        </ZGlassButton>
        <ZGlassButton variant="glass" size="lg" style={{ width: "100%" }} onClick={() => setTab(1)}>
          {t(lang, "compare.demo.secondary")}
        </ZGlassButton>
      </div>
    </Stage>
  );
}

/* ---------------- C. @ozcanyldzhn/liquid-glass-js ---------------- */

function SceneOzcan({ lang, scheme }: { lang: Lang; scheme: Scheme }) {
  const [tab, setTab] = useState(0);
  const [on, setOn] = useState(true);
  const [seg, setSeg] = useState(1);
  const [value, setValue] = useState(55);
  const segLabels = [t(lang, "compare.demo.segA"), t(lang, "compare.demo.segB"), t(lang, "compare.demo.segC")];

  const sliderRef = useRef<HTMLDivElement>(null);
  const sliderFromPointer = (e: ReactPointerEvent) => {
    const r = sliderRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    setValue(Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))));
  };

  return (
    <Stage
      scheme={scheme}
      tabBar={
        <LiquidGlass width={CONTENT_W} height={62} radius={31} thickness={46} bezel={20} blur={1}>
          <div className="cmp-c-tabs">
            {TAB_ICONS.map((tabDef, i) => (
              <button
                key={tabDef.key}
                type="button"
                className="cmp-c-tab"
                data-selected={tab === i ? "true" : "false"}
                aria-pressed={tab === i}
                onClick={() => setTab(i)}
              >
                <span className="cmp-c-tab-icon">{tabDef.icon}</span>
                <span>{t(lang, tabDef.key as StringKey)}</span>
              </button>
            ))}
          </div>
        </LiquidGlass>
      }
    >
      <SceneHeading lang={lang} />
      <LiquidGlass width={CONTENT_W} height={104} radius={24} thickness={64} bezel={26} blur={1}>
        <div className="cmp-card-body" data-c="true">
          <p className="cmp-card-title">{t(lang, "compare.demo.cardTitle")}</p>
          <p className="cmp-card-text">{t(lang, "compare.demo.cardText")}</p>
        </div>
      </LiquidGlass>

      <div className="cmp-row">
        <span className="cmp-row-label">{t(lang, "compare.demo.toggle")}</span>
        <button
          type="button"
          className="cmp-c-switch"
          aria-pressed={on}
          aria-label={t(lang, "compare.demo.toggle")}
          onClick={() => setOn((v) => !v)}
        >
          <LiquidGlass
            width={51}
            height={31}
            radius={16}
            thickness={18}
            bezel={9}
            blur={1}
            tintColor={on ? "#34C759" : "#FFFFFF"}
            tintOpacity={on ? 55 : 12}
          >
            <span className="cmp-c-knob" data-on={on ? "true" : "false"} />
          </LiquidGlass>
        </button>
      </div>

      <LiquidGlass width={CONTENT_W} height={38} radius={19} thickness={30} bezel={14} blur={1}>
        <div className="cmp-c-segs">
          {segLabels.map((label, i) => (
            <button
              key={label}
              type="button"
              className="cmp-c-seg"
              data-selected={seg === i ? "true" : "false"}
              aria-pressed={seg === i}
              onClick={() => setSeg(i)}
            >
              {label}
            </button>
          ))}
        </div>
      </LiquidGlass>

      <div>
        <p className="cmp-slider-label">{t(lang, "compare.demo.slider")}</p>
        <div
          ref={sliderRef}
          className="cmp-slider-hit"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            sliderFromPointer(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) sliderFromPointer(e);
          }}
        >
          <LiquidGlass width={CONTENT_W} height={30} radius={15} thickness={22} bezel={10} blur={1}>
            <div className="cmp-c-track">
              <div className="cmp-c-fill" style={{ width: `${value}%` }} />
              <div className="cmp-c-thumb" style={{ left: `calc(${value}% - 13px)` }} />
            </div>
          </LiquidGlass>
        </div>
      </div>

      <div className="cmp-stack">
        <LiquidButton
          variant="primary"
          radius={25}
          style={{ display: "block", width: "100%", height: 50 }}
          onClick={() => setOn((v) => !v)}
        >
          {t(lang, "compare.demo.primary")}
        </LiquidButton>
        <LiquidButton
          variant="default"
          radius={25}
          style={{ display: "block", width: "100%", height: 50 }}
          onClick={() => setTab(1)}
        >
          {t(lang, "compare.demo.secondary")}
        </LiquidButton>
      </div>
    </Stage>
  );
}

/* ---------------- page ---------------- */

const COLUMNS: {
  label: string;
  factKey: StringKey;
  Scene: (props: { lang: Lang; scheme: Scheme }) => ReactNode;
}[] = [
  { label: "Ours (packages/glass)", factKey: "compare.fact.ours", Scene: SceneOurs },
  { label: "@zakisheriff/liquid-glass", factKey: "compare.fact.zaki", Scene: SceneZaki },
  { label: "@ozcanyldzhn/liquid-glass-js", factKey: "compare.fact.ozcan", Scene: SceneOzcan },
];

export function Compare() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [scheme, setScheme] = useState<Scheme>("light");

  return (
    <div className="compare-page sc-font" data-scheme={scheme}>
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
          <Link className="toolbar-button" to="/components">
            {t(lang, "toolbar.components")}
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

      <div className="compare-wrap">
        <header>
          <p className="lab-eyebrow">{t(lang, "compare.eyebrow")}</p>
          <h1 className="catalog-h1">{t(lang, "compare.title")}</h1>
          <p className="catalog-subtitle">{t(lang, "compare.subtitle")}</p>
          <p className="compare-hint">{t(lang, "compare.hint")}</p>
        </header>

        <section className="compare-facts" aria-label={t(lang, "compare.factTitle")}>
          {COLUMNS.map((col) => (
            <article key={col.label} className="compare-fact">
              <h3>{col.label}</h3>
              <p>{t(lang, col.factKey)}</p>
            </article>
          ))}
        </section>

        <main className="compare-scenes">
          {COLUMNS.map((col) => (
            <section key={col.label} className="compare-col" aria-label={col.label}>
              <h2 className="compare-col-label">{col.label}</h2>
              <col.Scene lang={lang} scheme={scheme} />
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
