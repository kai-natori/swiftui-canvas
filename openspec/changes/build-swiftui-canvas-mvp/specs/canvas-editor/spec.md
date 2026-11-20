# Spec Delta — canvas-editor

## ADDED Requirements

### Requirement: Infinite canvas of screens
The editor SHALL provide an infinite canvas (pan, zoom, fit-to-view)
holding any number of screens, each addable, duplicable, deletable,
renamable and draggable as a unit with its parts.

### Requirement: Part manipulation
Parts SHALL be added by dragging from the palette onto a screen, and
then be selectable, movable, resizable (bars keep fixed sizes),
duplicable, nudgable by keyboard and deletable. Movement SHALL snap to
an 8pt grid and to other parts' and the screen's guides. Every mutation
SHALL be undoable and redoable.

#### Scenario: Dropping a button
- **WHEN** a user drags Button from the palette onto a screen
- **THEN** a button part appears at the drop point, selected, with the
  inspector showing its editable properties

### Requirement: Tidy
A tidy action SHALL snap bars to the screen edges and restack the
remaining parts on 16pt margins inside the body area, as one undoable
step.

### Requirement: Visible navigation flow
For every part with a link, the canvas SHALL draw an arrow from the part
to its target screen.
