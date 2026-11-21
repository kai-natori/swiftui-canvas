# Spec Delta — prompt-export

## ADDED Requirements

### Requirement: Fixed modern SwiftUI baseline
Every generated prompt SHALL target SwiftUI on iOS 26.0 with Swift 6.2,
use modern navigation, observation, styling and glass APIs, and preserve
the design's strings and SF Symbol names verbatim.

#### Scenario: Inspecting the generated API baseline
- **WHEN** a prompt is generated in any supported language
- **THEN** it specifies NavigationStack and TabView + Tab (never
NavigationView); @Observable; foregroundStyle; SF Symbol names verbatim
in `Image(systemName:)`; Liquid Glass via automatic toolbar glass and
`.glassEffect()` / GlassEffectContainer / `buttonStyle(.glass)` for
custom controls; `.scrollEdgeEffectStyle`; zoom via
`.navigationTransition(.zoom)`; and an instruction to use the prompt's
strings verbatim, never translated

### Requirement: Prompt structure and languages
The prompt SHALL contain, in order: an overview, the theme (accent
colour as RGB numbers, appearance, font design, shape), one section per
screen listing parts in visual order with their labels, options, values
and behaviour notes, and the navigation/behaviour section including all
links and transitions. Output SHALL be available in English, Japanese
and Chinese with identical API wording, for the whole document or for a
single screen.

#### Scenario: Copying a whole-design prompt in Japanese
- **WHEN** the user selects Japanese and copies the prompt
- **THEN** the clipboard holds the full structure above in Japanese,
  with the API baseline wording identical in substance to the English
  version
