# Spec Delta — liquid-glass

## ADDED Requirements

### Requirement: Three-layer glass material
Every glass surface SHALL be rendered with three layers: (1) rim
refraction via an SVG displacement filter in `backdrop-filter` where the
browser supports it, (2) a frost layer of blur, saturation and brightness
with a translucent tint, and (3) a specular top-edge highlight, inner
shadow and 0.5px bright border. Where layer 1 is unsupported the surface
SHALL still render correctly from layers 2–3, and product copy SHALL
describe this degradation honestly.

#### Scenario: Glass over a photo background in Chromium
- **WHEN** a glass tab bar sits over a photo-like screen background
- **THEN** the background visibly refracts at the bar's rim and the bar
  reads as glass, not as a flat translucent rectangle

#### Scenario: Glass in Safari
- **WHEN** the same screen is shown in Safari
- **THEN** the bar renders as frosted glass with highlight and border,
  with no missing or broken backdrop

### Requirement: Floating capsule tab bar
The tab bar SHALL float: 16pt side insets, 8pt above the screen bottom,
about 62pt tall, fully capsule-shaped, with the selected tab highlighted
by a brighter glass pill. It SHALL NOT be a full-width bar and SHALL NOT
carry a top separator line. The home indicator belongs to the screen
chrome, outside the bar.

### Requirement: Glass navigation chrome
The navigation bar SHALL NOT render a full-width bar or separator.
Leading and trailing actions SHALL be glass circle or capsule buttons;
the title floats as text, with the large title kept in its iOS position
when the large variant is used.
