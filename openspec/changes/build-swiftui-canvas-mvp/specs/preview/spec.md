# Spec Delta — preview

## ADDED Requirements

### Requirement: Tap-through preview
The preview SHALL render one screen inside a phone frame and let the
user tap through the design: linked parts navigate with their transition
(push / zoom / sheet / cover), `back` returns, tab bar items switch to
their target screens, and parts with `presents` show their alert or
sheet, which can be dismissed.

#### Scenario: Following a push link
- **WHEN** the user taps a part linked with transition push
- **THEN** the preview shows the target screen with a push transition
  and a way back
