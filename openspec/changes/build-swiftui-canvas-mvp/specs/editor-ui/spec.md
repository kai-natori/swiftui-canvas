# Spec Delta — editor-ui

## ADDED Requirements

### Requirement: The editor itself is Liquid Glass SwiftUI style
The editor's toolbar, parts palette, inspector and panels SHALL be built
from the same glass material as the canvas parts, and SHALL follow a
native SwiftUI app design language: system colour tokens, an SF-style
font stack, iOS-style toolbar and segmented controls, and an inspector
modelled on Xcode's SwiftUI preview inspector. Generic web-dashboard
styling SHALL NOT be used. The canvas background SHALL default to a
photo-like gradient so glass surfaces read as glass.

### Requirement: Full i18n
Every user-facing editor string SHALL be available in English, Japanese
and Chinese through the i18n table; no string is hard-coded in a
component.

#### Scenario: Switching the interface to Japanese
- **WHEN** the user sets the interface language to Japanese
- **THEN** all toolbar, palette, inspector and panel labels render in
  Japanese with no English leftovers
