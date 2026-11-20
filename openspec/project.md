# SwiftUI Canvas — Project

## Purpose
A browser tool where anyone assembles iOS app screens from native-looking
SwiftUI parts by drag-and-drop, links screens, tap-previews the flow, and
copies a detailed prompt for AI coding tools (Claude Code, Codex, Cursor).
It is the SwiftUI equivalent of M3E Canvas (Material 3 Expressive).

Differentiation: Liquid Glass fidelity in the browser canvas itself —
a floating capsule tab bar, glass toolbars, refraction/specular material,
not just backdrop blur — and the tool's own UI is itself designed in
Liquid Glass / native SwiftUI style, the way M3E Canvas's site is itself
Material 3 Expressive.

## Decisions (owner, 2026-11-20)
- Name: **SwiftUI Canvas** (an existing same-named 0-star project exists;
  differentiation is by content, not the name).
- Build **from scratch** — no fork of jason2be/SwiftUI-Canvas or M3E Canvas.
- Development is **OpenSpec-driven**: Muse writes proposal/specs/tasks,
  implements along them (code generation, typecheck, tests, E2E), and the
  owner reviews on a Cloudflare preview URL before anything reaches main.
- Stack: Turborepo monorepo (`apps/web` + `packages/core`, `packages/prompt`,
  `packages/glass`), pnpm. Hosting: Cloudflare **Workers** (owner, 2026-11-20: Workers preferred over Pages — apps/web ships as a Worker like his other projects, serving the SPA via Workers Static Assets / the Cloudflare Vite plugin). **No GitHub Actions.**
  Telemetry disabled (`TURBO_TELEMETRY_DISABLED=1`, `DO_NOT_TRACK=1`).
- Commits: author Kai Natori; Muse commits carry the trailer
  `Co-authored-by: Kinako (Muse) <kinako@local>`.
- No backend, no account: documents live in localStorage, JSON files and
  share links.

## Conventions
- Specs before behaviour changes: add a change under `openspec/changes/`,
  write the delta specs and tasks, then implement and archive.
- UI review: Cloudflare preview URL first; production only after owner OK.
- Every user-facing string goes through i18n (en / ja / zh from the start).
