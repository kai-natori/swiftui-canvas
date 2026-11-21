# Spec Delta — static-hosting

## ADDED Requirements

### Requirement: Local Pages build
`pnpm build:pages` SHALL produce static output for `/swiftui-canvas/`,
accept an explicit base path, and emit HTML entry points and `.nojekyll`.
The command SHALL NOT push or publish files.

#### Scenario: Building for project Pages
- **WHEN** the owner runs `pnpm build:pages`
- **THEN** `dist/client` contains `index.html`, `404.html`, `.nojekyll`,
  and directory entry points for components, glass-lab and compare
- **AND** no remote branch or deployment is changed

### Requirement: Base-aware navigation
Routes, assets, internal navigation, catalog insertion and shared
projects SHALL work under the configured base path, with no server
rewrite rules. Hash fragments SHALL remain available for project sharing.
The default root-path development and Cloudflare builds SHALL still work.

#### Scenario: Reloading a nested page
- **WHEN** a user opens or reloads `/swiftui-canvas/components/`
- **THEN** the catalog and its assets load from static files
- **AND** adding a part returns to the editor under `/swiftui-canvas/`

#### Scenario: Sharing under the project path
- **WHEN** a user shares a design from `/swiftui-canvas/`
- **THEN** a fresh browser can open that path with its `#sc=` payload
  and restore the same design

#### Scenario: Using the root-path build
- **WHEN** the app runs at `/` in development or a root-path deployment
- **THEN** its internal links and assets resolve without the project prefix

### Requirement: Bounded project ingress
JSON ingress SHALL reject data over 20,000,000 UTF-8 bytes. Share
decoding SHALL reject encoded payloads over 1,000,000 characters and
stop streamed decompression beyond 20,000,000 bytes.

#### Scenario: Rejecting oversized input
- **WHEN** an imported JSON file or expanded share payload exceeds its limit
- **THEN** it is rejected without replacing the current saved project
- **AND** an error message explains that the input cannot be opened

### Requirement: Manual publication documentation
The README SHALL describe manual GitHub Pages publication, development
preview status, and the limited scope of release checks.

#### Scenario: Following the publication instructions
- **WHEN** the owner follows the README
- **THEN** building and publishing are separate explicit steps
- **AND** only static build output is copied to the publication branch
