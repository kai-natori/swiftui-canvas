# Design

Source of truth for the long-form rationale: `MVP-DESIGN.md` at the repo
root. This file records the decisions in OpenSpec form.

## D1. Monorepo shape
Turborepo + pnpm workspace. `apps/web` depends on `packages/core`,
`packages/prompt`, `packages/glass`. Core and prompt MUST NOT import React
or DOM UI code, so a future CLI/MCP can consume them in Node unchanged.

## D2. Framework for apps/web — DECIDED: TanStack Start (SPA mode)
Owner decision 2026-11-20: **TanStack Start**, superseding the earlier
Vite recommendation. Rationale: all of the owner's other projects
(twiceword, natori-inn, SupportBank) are TanStack Start + Turborepo +
Cloudflare, so build/deploy conventions stay uniform; and if a landing
SSR, OG or server functions are ever needed, the same app can move to
Cloudflare Workers without a migration. The app runs Start in **SPA mode
with static prerendering** (no server functions, no server loaders), so
the production artifact is static (`dist/client/`) and can also be
hosted on GitHub Pages (Nitro `github_pages` preset; `index.html` copied
to `404.html`, `.nojekyll`, base path set for project pages) — although
the primary host is Cloudflare **Workers** (owner decision 2026-11-20, superseding Pages — same Worker shape as twiceword / natori-inn), since GitHub Actions are not used.

## D3. Document model
As specified in `specs/document-model`. One JSON shape is simultaneously
the storage format, the file format, the share-link payload and the prompt
input. Screen size is fixed at 393×852 pt for the MVP; coordinates are
points on an 8 pt grid.

## D4. Glass material (three layers)
1. Refraction: an SVG `feDisplacementMap` filter applied via
   `backdrop-filter: url(...)`, distorting only the rim of the shape.
   Chromium only; the filter MUST be generated from the element's radius
   so capsules and circles both refract correctly.
2. Frost: `backdrop-filter: blur(20px) saturate(180%) brightness(1.06)`
   plus a translucent tint — the fallback on Safari/Firefox, where the
   product copy states the degradation honestly.
3. Surface: a specular top-edge highlight (1px gradient line + inner
   shadow), a soft outer drop shadow, and a 0.5px bright border.
Glass containers are approximated by sharing one backdrop layer among
adjacent glass elements; true GlassEffectContainer morphing is explicitly
not attempted.

## D5. Tab bar and navigation bar shapes
The tab bar is a floating capsule (16pt side insets, 8pt above the bottom,
≈62pt tall, fully rounded) with a brighter glass pill under the selected
tab; the home indicator belongs to the screen chrome, not the bar. The
navigation bar has no full-width bar or separator: the title floats as
text (large title in place) and leading/trailing actions are glass circle
or capsule buttons, matching iOS 26 behaviour.

## D6. Editor UI language
The editor chrome is a native SwiftUI app rendered in the browser: system
colour tokens and an SF-style font stack, iOS toolbar and segmented
controls, an inspector modelled on Xcode's SwiftUI preview inspector, SF
Symbol names as the single icon vocabulary (drawn on the web with
licence-safe Lucide lookalikes). Generic dashboard styling (e.g. default
shadcn look) is not used. The canvas background defaults to a photo-like
gradient so glass surfaces read as glass.

## D7. Prompt baseline
Fixed text, versioned with the prompt package: iOS 26.0 / Swift 6.2,
NavigationStack and TabView + Tab only, @Observable, foregroundStyle,
SF Symbols verbatim, copy verbatim (never translated by the coding tool),
Liquid Glass APIs for custom glass, scroll edge effects, zoom transition.
Languages en / ja / zh with identical API wording.

## D8. Share links
`#sc=` + base64url(deflate-raw(JSON)). No server. Tolerant ingress:
a malformed part is dropped with a warning rather than rejecting the
whole document; strict validation is used when saving.

## Open questions
- Q1 (D2): Vite + React SPA, or Next.js static export? — owner, before 2.1.
- Q2: Domain — custom domain now, or ship on `*.pages.dev` first?
- Q3: Licence — MIT public from the start, or private repo until launch?
  (Q2/Q3 do not block implementation.)
