# Spec Delta — canvas-editor

## ADDED Requirements

### Requirement: Infinite canvas of screens
The editor SHALL provide an infinite canvas (pan, zoom, fit-to-view)
holding any number of screens, each addable, duplicable, deletable,
renamable and draggable as a unit with its parts.

#### Scenario: Fitting multiple screens
- **WHEN** the user adds three screens and chooses Fit
- **THEN** all screens are visible in the canvas
- **AND** dragging a screen moves its parts with it

### Requirement: Part manipulation
Parts SHALL be added by dragging from the palette onto a screen, and
then be selectable, movable, resizable (bars keep fixed sizes),
duplicable, nudgable by keyboard and deletable. Movement SHALL snap to
an 8pt grid and to other parts' and the screen's guides. Every mutation
SHALL be undoable and redoable.

Native palette dragging SHALL remain enabled despite palette CSS resets.

#### Scenario: Dropping a button
- **WHEN** a user drags Button from the palette onto a screen
- **THEN** a button part appears at the grid-snapped drop location, selected,
  with the inspector showing its editable properties
- **AND** it is not moved to the automatically chosen stacking position

### Requirement: Tidy
A tidy action SHALL snap bars to the screen edges and restack the
remaining parts on 16pt margins inside the body area, as one undoable
step.

#### Scenario: Undoing tidy
- **WHEN** the user tidies a screen and then chooses Undo
- **THEN** its parts return to their previous positions

### Requirement: Visible navigation flow
For every part with a link, the canvas SHALL draw an arrow from the part
to its target screen.

#### Scenario: Linking screens
- **WHEN** a button targets another screen
- **THEN** the canvas displays an arrow connecting the button to that screen
