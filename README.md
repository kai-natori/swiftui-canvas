# SwiftUI Canvas

Assemble iOS app screens from native SwiftUI parts in the browser, link
them, tap through them, and copy a detailed prompt for AI coding tools —
with Liquid Glass rendered on the canvas itself.

## Develop

```bash
pnpm install
pnpm dev        # the web app (glass lab for now)
pnpm typecheck
pnpm test
pnpm build
```

Telemetry is off: run tools with `DO_NOT_TRACK=1
TURBO_TELEMETRY_DISABLED=1`. No GitHub Actions are used.

## Commits

Author: Kai Natori. Commits made by Muse carry the trailer
`Co-authored-by: Kinako (Muse) <kinako@local>`.

## Layout

| Path | What |
|---|---|
| `apps/web` | TanStack Start app in SPA mode (the editor) |
| `packages/core` | Document model, validation, share links, storage |
| `packages/prompt` | Prompt generation (en / ja / zh) |
| `packages/glass` | Liquid Glass material and components |

Behaviour contracts live in `openspec/`; the long-form design is in
`MVP-DESIGN.md`.

## Deploy (Cloudflare Workers)

The web app ships as a Cloudflare Worker named `swiftui-canvas`
(Workers Static Assets over the SPA build, `apps/web/wrangler.jsonc`;
no custom domain yet — workers.dev only). Wrangler is not authenticated
in every environment, so the deploy is a deliberate, separate step:

```bash
pnpm install
WRANGLER_SEND_METRICS=false pnpm --filter @swiftui-canvas/web run deploy
# = vite build && wrangler deploy, run in apps/web
```

`wrangler deploy --dry-run` validates the configuration and the asset
bundle without publishing.
