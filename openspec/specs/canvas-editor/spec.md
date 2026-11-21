# canvas-editor Specification

## Purpose

Define the implemented screen canvas and part-editing behavior. This
baseline is synchronized from the completed editor work in the MVP
change; that change remains open for its outstanding verification gates.

## Requirements

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

### Requirement: Automatic part placement
Catalog "Add to editor" SHALL add to the first screen, and palette click-add
SHALL add to the active screen, using the same automatic placement policy.
Placement SHALL use 16pt leading margins and spacing on the 8pt grid,
reserve visible chrome and bars, prefer appending below intersecting
content, and use earlier gaps when appending would clip.

#### Scenario: Adding to the starter screen with a tab bar
- **WHEN** a user adds a fitting ordinary part through the catalog or a
  palette click on the starter screen
- **THEN** it appears below existing content and above the tab bar, not
  below the tab bar or home indicator
- **AND** its position respects the 16pt margins/spacing and 8pt grid
- **AND** the content area reserves at least 16pt below enabled top chrome
  or the navigation bar, and above bottom chrome or the tab bar
- **AND** bars, overlay sheets and parts on other screens do not count
  as stacked content; disabled system chrome reserves no space

#### Scenario: Nearly-full screen with an earlier gap
- **WHEN** appending a part would exceed the content area's lower bound
  but an earlier vertical gap can fit the part and its spacing
- **THEN** the part is placed in that gap below the top bar/chrome and
  above the bottom bar/chrome
- **AND** at least 16pt of clearance remains from neighboring content

#### Scenario: Full screen without a free gap
- **WHEN** no free gap can fit a new part whose dimensions fit the content
  area
- **THEN** automatic placement keeps the part inside the content area and
  screen bounds on the grid, allowing overlap instead of clipping

### Requirement: Explicit palette drops
Explicit drops SHALL use pointer-relative coordinates snapped to the 8pt
grid rather than automatic stacking. Fixed-position navigation bars,
tab bars and sheets SHALL retain their existing anchors.

#### Scenario: Dropping at a chosen position
- **WHEN** a user drags an ordinary part to a screen position
- **THEN** the part uses the snapped pointer position even if automatic
  placement would have chosen a different vertical gap
