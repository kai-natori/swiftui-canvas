# Spec Delta — editor-ui

## ADDED Requirements

### Requirement: Xcode-style workspace
The editor SHALL use a compact Mac-style toolbar, screen/layer navigator,
searchable component library, neutral canvas, and trailing inspector.
System typography, quiet neutral surfaces and system-blue selection
SHALL establish hierarchy. Liquid Glass SHALL remain available inside
the iOS designs and material experiments. DESIGN.md records the current
visual direction requested by the owner.

#### Scenario: Editing on a narrow screen
- **WHEN** the viewport is 390px wide
- **THEN** the canvas remains visible and fits the screen, and Navigator
  and Inspector open as dismissible panels with keyboard focus contained

#### Scenario: Adding screen chrome twice
- **WHEN** the user adds a navigation bar or tab bar that already exists
  on the active screen
- **THEN** the existing bar is selected with explanatory feedback,
  without inserting an overlapping duplicate

### Requirement: Full i18n
Every user-facing editor string SHALL be available in English, Japanese
and Chinese through the i18n table; no string is hard-coded in a
component.

#### Scenario: Switching the interface to Japanese
- **WHEN** the user sets the interface language to Japanese
- **THEN** all toolbar, palette, inspector and panel labels render in
  Japanese with no English leftovers
