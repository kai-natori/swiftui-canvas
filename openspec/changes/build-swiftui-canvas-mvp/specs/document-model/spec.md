# Spec Delta — document-model

## ADDED Requirements

### Requirement: One JSON document model
The whole design SHALL be a single JSON document:
`Doc { version: 1, title, lang, theme, screens[], parts[] }`, with
`Screen { id, name, x, y, note?, bg?, chrome }` at a fixed 393×852 pt and
`Part { id, screen, kind, x, y, w?, h?, label, icon?, supporting?,
variant, options?, checked?, selected?, value?, note?, link?, presents? }`.
This one shape SHALL serve as storage, file, share-link payload and
prompt input. Part kinds in the MVP SHALL be exactly the 20 listed in
design.md §3 of MVP-DESIGN.md.

#### Scenario: A part links to another screen
- **WHEN** a part carries `link { target, transition }`
- **THEN** target is a screen id or `back`, and transition is one of
  push / zoom / sheet / cover / none

### Requirement: Two-tier validation
Saving SHALL use strict validation: any malformed screen, part, theme or
dangling reference rejects the document. Ingress (share links, opened
files, pasted documents) SHALL be tolerant: malformed parts are dropped,
dangling links/targets/presents are removed, duplicate ids are renamed,
and every repair is reported as a warning; a document is rejected only
when its theme or screen list is unusable.

#### Scenario: A shared link contains one broken part
- **WHEN** a link's document has one part with an unknown kind
- **THEN** the document opens without that part and a warning names the
  repair
