# Spec Delta — document-model

## ADDED Requirements

### Requirement: One JSON document model
The design SHALL use one versioned JSON document for storage, files,
share links and prompt input. Screens SHALL use a fixed 393×852 pt
coordinate system. The editor SHALL support the 27 part kinds in
`KIND_ORDER`, including Gauge, DatePicker and ColorPicker.

#### Scenario: Saving a complete design
- **WHEN** the user saves a design
- **THEN** its serialized shape is
`Doc { version: 1, title, lang, theme, screens[], parts[] }`, with
`Screen { id, name, x, y, note?, bg?, chrome }` at a fixed 393×852 pt and
`Part { id, screen, kind, x, y, w?, h?, label, icon?, supporting?,
variant, options?, checked?, selected?, value?, displayedComponents?,
date?, color?, image?, parent?, note?, link?, presents? }`

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

### Requirement: Embedded images
Images SHALL be optional embedded raster data URLs, with supported MIME
types PNG, JPEG, WebP and GIF and a maximum encoded length of 2,000,000
characters. The editor SHALL resize imported images to at most 1200px.
The image SHALL survive JSON, autosave and share-link round trips.

#### Scenario: Importing and sharing a photo
- **WHEN** the user imports a supported image and shares the project
- **THEN** the receiving browser displays the embedded image
- **AND** its largest dimension is at most 1200px

### Requirement: Flat container groups
`parent` SHALL reference a container (`box`) on the same screen.
Containers and screen chrome/presentation parts cannot themselves have
a parent. Coordinates remain screen-relative. Moving or tidying a
container SHALL preserve member offsets; duplicating a screen or group
SHALL remap container references. Deleting a container SHALL ungroup
its members without deleting them. Invalid parent references SHALL be
rejected strictly or removed with a warning during tolerant ingress.

#### Scenario: Moving and copying a group
- **WHEN** the user moves a container and duplicates its screen
- **THEN** members preserve their offsets from their container
- **AND** copied members reference the copied container

#### Scenario: Removing a container
- **WHEN** the user deletes a container
- **THEN** its members remain on the screen with no parent reference
