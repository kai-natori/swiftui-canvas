# Tasks

- [x] Add local Pages build and static route entry points.
- [x] Make navigation and router paths work under the project prefix.
- [x] Bound JSON/share ingress and cover oversized payloads.
- [x] Verify direct routes, navigation and sharing on a static server.
- [x] Document manual publishing and record release-check limitations.

Validation:

- Typecheck, lint, 61 unit tests, and the production Pages build pass.
- A plain static HTTP server (no SPA rewrites) served `/swiftui-canvas/`.
  Chrome passed direct/reloaded visits to all four routes, internal
  navigation, catalog-to-editor insertion, isolated share-link import,
  invalid-share recovery, literal rendering of HTML-like labels, oversized
  JSON rejection, and mobile preview/search. No page errors or failed
  responses were observed in the final run.
- Production dependency audit reported no known advisories. A bounded
  scan found no common token/private-key patterns in the project source.
  This is a targeted release check, not a comprehensive security audit.
- No branch was pushed and no public deployment was performed.
