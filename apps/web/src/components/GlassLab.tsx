import { useMemo, useState, type CSSProperties } from "react";

import { ACCENT_PRESETS, newDoc } from "@swiftui-canvas/core";
import { GlassButton, GlassTabBar, GlassToolbarButton } from "@swiftui-canvas/glass";
import { buildPrompt } from "@swiftui-canvas/prompt";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  GearIcon,
  HeartIcon,
  HouseIcon,
  PlusIcon,
  SearchIcon,
  ShareIcon,
  StarIcon,
} from "./icons";

/* Phase 0 — the glass lab (openspec tasks 0.1).
 *
 * A single sample screen in a 393x852 phone frame: photo-like gradient
 * header, list rows and a card, with the floating glass tab bar, glass
 * toolbar buttons and glass buttons over it. This page is the experiment
 * the owner reviews for glass quality — it is not the editor yet.
 */

type Scheme = "light" | "dark";

const TABS = [
  { id: "home", label: "Home" },
  { id: "search", label: "Search" },
  { id: "settings", label: "Settings" },
] as const;

function tabIcon(id: string) {
  if (id === "search") return <SearchIcon />;
  if (id === "settings") return <GearIcon />;
  return <HouseIcon />;
}

const ROWS = [
  { title: "Morning run", detail: "5.2 km · 28 min", icon: <StarIcon /> },
  { title: "Evening swim", detail: "1,200 m · 32 min", icon: <HeartIcon /> },
  { title: "Weekend ride", detail: "42 km · 1 h 47 min", icon: <PlusIcon /> },
];

export function GlassLab() {
  const [scheme, setScheme] = useState<Scheme>("light");
  const [accent, setAccent] = useState<string>("#007AFF");
  const [tab, setTab] = useState<string>("home");
  const [liked, setLiked] = useState(false);

  const promptPreview = useMemo(() => {
    const doc = newDoc("en");
    doc.title = "Glass Lab Sample";
    return buildPrompt(doc, { lang: "en" }).split("\n").slice(0, 18).join("\n");
  }, []);

  const accentVars = { "--sc-accent": accent } as CSSProperties;

  return (
    <div className="lab-page sc-font">
      <header className="lab-header">
        <div>
          <p className="lab-eyebrow">SwiftUI Canvas</p>
          <h1 className="lab-title">Glass Lab</h1>
          <p className="lab-subtitle">
            Phase 0 experiment: the Liquid Glass material over a sample screen. Refraction renders in
            Chromium; Safari and Firefox fall back to the frost layer.
          </p>
        </div>
        <div className="lab-controls" role="group" aria-label="Lab controls">
          <div className="lab-segmented" role="tablist" aria-label="Appearance">
            {(["light", "dark"] as Scheme[]).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={scheme === s}
                data-active={scheme === s}
                onClick={() => setScheme(s)}
              >
                {s === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
          <a className="lab-back" href="/">
            ← Editor
          </a>
          <div className="lab-accents" aria-label="Accent colour">
            {ACCENT_PRESETS.slice(0, 6).map((p) => (
              <button
                key={p.key}
                type="button"
                aria-label={p.key}
                data-active={accent === p.hex}
                style={{ background: p.hex }}
                onClick={() => setAccent(p.hex)}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="lab-main">
        <section className="lab-stage" aria-label="Sample screen">
          <div className="phone" data-scheme={scheme} style={accentVars}>
            <div className="phone-screen sc-font">
              {/* status bar (screen chrome) */}
              <div className="statusbar" aria-hidden="true">
                <span className="statusbar-time">9:41</span>
                <span className="statusbar-icons">
                  <span className="signal" />
                  <span className="wifi" />
                  <span className="battery" />
                </span>
              </div>

              {/* photo-like header with floating glass toolbar */}
              <div className="hero">
                <div className="hero-toolbar">
                  <GlassToolbarButton label="Back">
                    <ChevronLeftIcon />
                  </GlassToolbarButton>
                  <div className="hero-toolbar-group">
                    <GlassToolbarButton label="Share">
                      <ShareIcon />
                    </GlassToolbarButton>
                    <GlassToolbarButton label="More">
                      <EllipsisIcon />
                    </GlassToolbarButton>
                  </div>
                </div>
                <div className="hero-title">
                  <p className="hero-kicker">Today</p>
                  <h2>Activity</h2>
                </div>
              </div>

              {/* list rows */}
              <div className="list-card">
                {ROWS.map((row, i) => (
                  <div key={row.title} className="list-row" data-first={i === 0}>
                    <span className="list-row-icon">{row.icon}</span>
                    <span className="list-row-text">
                      <span className="list-row-title">{row.title}</span>
                      <span className="list-row-detail">{row.detail}</span>
                    </span>
                    <ChevronRightIcon size={15} />
                  </div>
                ))}
              </div>

              {/* card */}
              <div className="sample-card">
                <div className="sample-card-art" aria-hidden="true" />
                <div className="sample-card-body">
                  <p className="sample-card-title">Weekly goal</p>
                  <p className="sample-card-text">Four of five workouts done. One more session closes the ring.</p>
                  <div className="sample-card-progress" aria-hidden="true">
                    <span style={{ width: "80%" }} />
                  </div>
                </div>
              </div>

              {/* glass buttons */}
              <div className="button-stack">
                <GlassButton variant="glassProminent" accent={accent} onClick={() => setLiked((v) => !v)}>
                  {liked ? "Added to today" : "Add workout"}
                </GlassButton>
                <GlassButton variant="glass" onClick={() => setTab("search")}>
                  Browse programs
                </GlassButton>
              </div>

              {/* floating glass tab bar + home indicator */}
              <div className="tabbar-slot">
                <GlassTabBar
                  items={TABS.map((t) => ({ id: t.id, label: t.label, icon: tabIcon(t.id) }))}
                  selectedId={tab}
                  onSelect={setTab}
                />
              </div>
              <div className="home-indicator" aria-hidden="true" />
            </div>
          </div>
        </section>

        <aside className="lab-panel" aria-label="About this experiment">
          <h2>What to check</h2>
          <ul>
            <li>The tab bar floats as a capsule — no full-width bar, no separator line.</li>
            <li>Toolbar buttons are glass circles floating over the header art.</li>
            <li>In Chromium, the background bends at the rim of each glass surface.</li>
            <li>Toggle Light / Dark and the accent colour: the material follows.</li>
          </ul>
          <h2>Prompt preview</h2>
          <p className="lab-panel-note">
            Generated by <code>@swiftui-canvas/prompt</code> from a sample document:
          </p>
          <pre className="prompt-preview">{promptPreview}</pre>
        </aside>
      </main>
    </div>
  );
}
