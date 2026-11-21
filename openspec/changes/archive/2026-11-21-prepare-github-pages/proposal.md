# Prepare GitHub Pages publication

## Why

The owner intends to publish the development preview on GitHub Pages.
The existing Cloudflare build emits only `_shell.html`, and navigation
currently assumes the domain root. Project Pages must also work at
`/swiftui-canvas/` without a Worker or rewrite rules.

## What Changes

Add a local Pages build, base-aware navigation and static HTML entry
points. Preserve the no-GitHub-Actions convention. Publishing is a
separate manual action after reviewing the built site.

Keep the public-release check bounded: inspect production dependencies
and likely secrets, and cap project/share input sizes. No broad UI or
architecture refactor is required.

## Capabilities

### New Capabilities
- `static-hosting`: local Pages build, base-aware navigation, bounded
  project ingress and manual publication documentation.

## Impact

- Build configuration, static output, router links and project input handling.
- No new deployment workflow or production publication.
