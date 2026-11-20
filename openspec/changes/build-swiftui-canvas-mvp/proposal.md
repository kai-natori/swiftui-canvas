# Proposal

## Why

M3E Canvas proved the pattern — assemble real design-system parts on phone
screens in the browser, link them, and copy a structured prompt for an AI
coding tool — reaching 10,657 GitHub stars in about two months. The SwiftUI
seat is effectively empty: the only equivalent, jason2be/SwiftUI-Canvas,
has 0 stars and, critically, does not render Liquid Glass on its canvas
(its tab bar is a flat full-width iOS 18-style bar; glass exists only as
words inside its prompt). A landscape survey on 2026-11-20 found no browser
tool that renders iOS 26 Liquid Glass.

The owner decided on 2026-11-20 to build this tool from scratch, under the
name **SwiftUI Canvas**, with Liquid Glass fidelity as the core
differentiation and the tool's own UI itself built in Liquid Glass /
native SwiftUI style — the same meta-structure that made M3E Canvas
convincing (its site is itself Material 3 Expressive).

## What Changes

- A new Turborepo monorepo: `apps/web` (the editor, a static client-only
  app) plus three UI-independent packages — `packages/core` (document
  model, validation, share-link encoding), `packages/prompt` (prompt
  generation in en / ja / zh) and `packages/glass` (the Liquid Glass
  material). Core and prompt are kept UI-free so a future CLI / MCP server
  can reuse them unchanged.
- The editor: an infinite canvas holding iPhone screens (393×852 pt);
  20 part kinds in the MVP; drag-and-drop, snapping, undo/redo, tidy;
  navigation links between screens with push / zoom / sheet / cover
  transitions, drawn as arrows on the canvas.
- Liquid Glass rendering: a three-layer material (SVG-displacement
  refraction at the rim on Chromium, frosted blur/saturate everywhere,
  specular edge highlight and inner shadow) applied to a floating capsule
  tab bar, glass toolbar buttons, glass buttons, sheets and alerts.
- A tap-through preview inside a phone frame.
- Prompt export that pins a modern SwiftUI baseline (iOS 26,
  NavigationStack, TabView + Tab, @Observable, foregroundStyle,
  glassEffect APIs, SF Symbols verbatim, copy verbatim).
- Persistence with no backend: localStorage autosave, JSON save/open,
  and share links carrying the deflated document in the URL hash.
- The editor's own chrome (toolbar, palette, inspector, panels) uses the
  same glass package and a native SwiftUI app design language — system
  colours and type, iOS-style toolbar and segmented controls, an
  Xcode-preview-style inspector — never a generic web-dashboard look.

## Capabilities

### New Capabilities
- `document-model`: the Doc/Screen/Part/Theme model, its validation
  (strict on save, tolerant on ingress) and ID/coordinate rules.
- `liquid-glass`: the glass material recipe, its browser degradation
  rules, and its application to tab bar, toolbar, buttons and modals.
- `canvas-editor`: canvas navigation, screen and part manipulation,
  snapping, history, tidy, and navigation-arrow rendering.
- `preview`: the tap-through phone-frame preview and its transition and
  presentation behaviour.
- `prompt-export`: the prompt's fixed API baseline, structure and
  languages, for the whole document or a single screen.
- `persistence-sharing`: localStorage autosave, JSON file save/open and
  hash share links.
- `editor-ui`: the editor chrome's own Liquid Glass / SwiftUI-native
  design language and i18n coverage.

### Modified Capabilities
- None. Greenfield project.

## Impact
- **Code**: entirely new repository; nothing existing is modified.
- **Sequencing**: Phase 0 is a glass-material experiment only (floating
  tab bar + glass button over a photo background, checked in Chromium and
  Safari) — the whole product stands on it, so it precedes the editor.
- **Out of scope for the MVP**: CLI and MCP server (package boundaries
  anticipate them), PNG export, layers panel, align tools, the remaining
  part kinds (Gauge, Chart, Map, DatePicker, TextEditor, ShareLink,
  Disclosure, LabeledContent), accounts or any server storage.
- **Open questions**: framework for `apps/web` (Vite + React SPA
  recommended over Next.js static export — client-only, no SSR need) and
  domain / licence, recorded in design.md; the framework answer is needed
  before task 2.1.
