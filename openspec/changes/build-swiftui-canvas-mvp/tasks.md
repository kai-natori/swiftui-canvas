# Tasks

## 0. Phase 0 — Glass experiment (before everything)
- [x] 0.1 Standalone page in `packages/glass` playground form: a floating
      capsule tab bar and glass / glassProminent buttons over a photo
      background, using the D4 three-layer recipe — done 2026-11-20 as
      the "glass lab" route of `apps/web` (phone frame, sample screen,
      light/dark + accent controls), built from `packages/glass`
- [ ] 0.2 Verify in Chromium (refraction visible at the rim) and Safari
      (frost fallback, no broken rendering); tune blur/saturate/highlight
      values; record the final tokens in `packages/glass`
- [ ] 0.3 Owner reviews the experiment on a preview URL; glass quality is
      accepted before Phase 1 starts

## 1. Groundwork
- [x] 1.1 Resolve Q1 (framework) with the owner; record the answer in
      design.md D2 — resolved 2026-11-20: TanStack Start in SPA mode
      (owner's decision; see design.md D2)
- [x] 1.2 Initialise the Turborepo + pnpm workspace (telemetry disabled),
      root scripts: dev / build / typecheck / test / lint; commit rules
      (author + Co-authored-by trailer) noted in the repo README

## 2. Core (packages/core)
- [x] 2.1 Implement the Doc/Screen/Part/Theme types and `newDoc` /
      `defaultPart` factories for the 20 MVP part kinds
- [x] 2.2 Strict validator (`isProject`) and tolerant ingress
      (`validateDoc` with warnings), with unit tests for both
- [x] 2.3 Share-link encode/decode (`#sc=`, deflate-raw + base64url) with
      round-trip tests
- [x] 2.4 localStorage autosave/load helpers with tests

## 3. Glass (packages/glass)
- [x] 3.1 Promote the Phase 0 material into components: GlassSurface,
      GlassTabBar, GlassToolbarButton, GlassButton, GlassSheet/Alert
- [x] 3.2 System colour/type tokens (light + dark), SF-style font stack,
      icon mapping (SF Symbol name → Lucide lookalike)

## 4. Editor (apps/web)
- [x] 4.1 Infinite canvas: pan, zoom, fit; screen add/duplicate/delete/
      rename and drag; screen chrome (status bar, home indicator)
- [x] 4.2 Parts palette (20 kinds) with drag-and-drop onto screens;
      selection, move, resize, 8pt snapping and guides
- [x] 4.3 Inspector for the selected part (label, icon picker, variant,
      options, value/checked/selected, note, link target + transition,
      presents)
- [x] 4.4 History (undo/redo), duplicate, nudge, delete; keyboard map
- [x] 4.5 Tidy: bars to the edges, remaining parts stacked on 16pt margins
- [x] 4.6 Navigation arrows from linked parts to their target screens
- [x] 4.7 Editor chrome in the D6 language, built from packages/glass;
      theme panel (accent, scheme, shape, font design)
- [x] 4.8 i18n wiring: every editor string in en / ja / zh

## 5. Preview
- [x] 5.1 Phone-frame preview: tap navigation for push / zoom / sheet /
      cover, back, tab switching, alert/sheet presentation and dismissal

## 6. Prompt (packages/prompt)
- [x] 6.1 Prompt builder: overview, theme (accent as RGB), per-screen
      parts in visual order, transitions and notes, fixed API baseline;
      whole-document and single-screen variants
- [x] 6.2 en / ja / zh output with identical API wording; golden-file
      tests per language
- [x] 6.3 Prompt panel in the editor: language switch, copy button

## 7. Persistence and sharing (editor integration)
- [x] 7.1 Autosave to localStorage; restore on load; JSON save/open via
      the core helpers
- [x] 7.2 Share button: builds the `#sc=` link; opening such a link loads
      the document through tolerant ingress and surfaces warnings

## 8. Verification and delivery
- [x] 8.1 Typecheck, lint and full unit suites green across the monorepo
- [ ] 8.2 Browser smoke: build a 3-screen flow with a glass tab bar, link
      it, preview it end to end, copy each language's prompt and check
      the baseline text; desktop and mobile widths; console clean
- [ ] 8.3 Deploy apps/web as a Cloudflare Worker (preview URL first);
      owner reviews; only after the owner's OK does the build go to
      production / main — PREPARED 2026-11-20: wrangler.jsonc (worker
      `swiftui-canvas`, workers.dev only, ASSETS binding over
      dist/client) + worker.ts SPA-shell fallback are in place and
      `wrangler deploy --dry-run` passes; the deploy itself waits for
      wrangler auth in the environment and a GitHub repo

## 9. Components catalog (added 2026-11-21)
- [x] 9.2 Promote Gauge, DatePicker and ColorPicker to editable parts with native-style previews, localized prompts, validation and sharing.
- [x] 9.1 /components page: all 24 part kinds rendered live with the
      SwiftPart renderer, labelled by the SwiftUI view each generates,
      grouped by Apple Developer Documentation (SwiftUI) topics /
      HIG component groups; category filter + search; coverage section
      listing SwiftUI views not yet parts (Gauge, DatePicker, Chart,
      Map, WebView, ...); "Add to editor" hand-off adds the chosen part
      to the editor's first screen; en/ja/zh throughout
