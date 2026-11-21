# Requirements

- `pnpm build:pages` MUST produce static output for the project path
  `/swiftui-canvas/`, with an optional explicit base-path argument.
- The output MUST contain `index.html`, `.nojekyll`, `404.html`, and
  directory entry points for components, glass-lab and compare.
- Internal links, catalog-to-editor actions, assets and shared projects
  MUST work under the configured base path, including direct visits and
  reloads. URL fragments remain available for `#sc=` project sharing.
- The default development/Cloudflare root build MUST keep working.
- The command MUST build locally and MUST NOT push or publish anything.
- JSON ingress MUST reject projects over 20,000,000 UTF-8 bytes. Share
  decoding MUST bound both the encoded input (1,000,000 characters) and
  streamed decompressed output (20,000,000 bytes), rejecting over-limit
  payloads rather than attempting an unbounded expansion.
- The README MUST explain the manual GitHub Pages publication procedure,
  the development-preview status, and the scope of the release checks.
