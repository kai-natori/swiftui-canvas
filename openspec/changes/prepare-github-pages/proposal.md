# Prepare GitHub Pages publication

The owner intends to publish the development preview on GitHub Pages.
The existing Cloudflare build emits only `_shell.html`, and navigation
currently assumes the domain root. Project Pages must also work at
`/swiftui-canvas/` without a Worker or rewrite rules.

Add a local Pages build, base-aware navigation and static HTML entry
points. Preserve the no-GitHub-Actions convention. Publishing is a
separate manual action after reviewing the built site.

Keep the public-release check bounded: inspect production dependencies
and likely secrets, and cap project/share input sizes. No broad UI or
architecture refactor is required.
