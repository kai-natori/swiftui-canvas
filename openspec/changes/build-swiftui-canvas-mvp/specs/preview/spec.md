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

### Requirement: Interactive controls and isolated state
Text and secure fields, search, toggle, slider, stepper, segmented
control, picker, menu, date picker and color picker SHALL respond to
keyboard and pointer input in preview. Search SHALL filter list rows on
the same screen and expose a recoverable no-results state. Control values
SHALL be local to the preview and SHALL NOT mutate the saved design.

#### Scenario: Trying a control
- **WHEN** the user changes a control, then closes and reopens preview
- **THEN** the control returns to its design value

### Requirement: Accessible preview and prompt dialogs
Dialogs SHALL contain focus, disable background editor shortcuts,
offer a visible close control, support Escape and restore focus to the
launching control. The preview close control SHALL remain above the
device frame at both desktop and phone widths.

#### Scenario: Closing a dialog by keyboard
- **WHEN** the user opens preview or prompt and presses Escape
- **THEN** the dialog closes and focus returns to its launching control
- **AND** editor shortcuts do not mutate the design while the dialog is open

### Requirement: Search tab activation
A tab option with `role: search` SHALL open a bottom search field and
search the current destination screen's text, cards, image labels,
buttons, links and list rows. Legacy options with a magnifying-glass
icon and no explicit role SHALL retain this behavior; `role: default`
SHALL opt out. Cancel or Escape SHALL restore the previous screen and
tab selection. Search state SHALL never persist to the edited document.

#### Scenario: Searching and cancelling
- **WHEN** the user selects a search tab, enters a matching query, and cancels
- **THEN** matching screen content is shown while searching
- **AND** cancellation restores the previous screen and selected tab
- **AND** the saved design is unchanged
