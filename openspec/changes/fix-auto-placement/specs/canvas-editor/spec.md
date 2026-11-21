# Spec Delta — canvas-editor

## MODIFIED Requirements

### Requirement: Part manipulation
Parts SHALL be added by dragging from the palette onto a screen, and
then be selectable, movable, resizable (bars keep fixed sizes),
duplicable, nudgable by keyboard and deletable. Movement SHALL snap to
an 8pt grid and to other parts' and the screen's guides. Every mutation
SHALL be undoable and redoable.

Native palette dragging SHALL remain enabled despite palette CSS resets.
An explicit drop SHALL use the existing pointer-relative drop coordinates,
snapped to the 8pt grid, rather than automatic stacking. Fixed-position
navigation bars, tab bars and sheets SHALL retain their existing anchors.

#### Scenario: Dropping a button
- **WHEN** a user drags Button from the palette onto a screen
- **THEN** a button part appears at the grid-snapped drop location, selected,
  with the inspector showing its editable properties
- **AND** it is not moved to the automatically chosen stacking position

## ADDED Requirements

### Requirement: Automatic part placement
Catalog "Add to editor" SHALL add to the first screen, and palette click-add
SHALL add to the active screen, using the same automatic placement policy.
Ordinary parts SHALL be placed at the 16pt leading margin on the 8pt grid.
The content area SHALL reserve at least 16pt below top system chrome or the
navigation bar and above bottom system chrome or the tab bar. Chrome SHALL
only be reserved when enabled for the screen.

Automatic placement SHALL prefer appending below horizontally intersecting
content with at least 16pt spacing. Bars, overlay sheets and parts on other
screens SHALL NOT count as stacked content. If appending does not fit, the
editor SHALL search earlier vertical gaps with at least 16pt clearance
from neighboring content.

#### Scenario: Adding to the starter screen with a tab bar
- **WHEN** a user adds a fitting ordinary part through the catalog or a
  palette click on the starter screen
- **THEN** it appears below existing content and above the tab bar, not
  below the tab bar or home indicator
- **AND** its position respects the 16pt margins/spacing and 8pt grid

#### Scenario: Nearly-full screen with an earlier gap
- **WHEN** appending a part would exceed the content area's lower bound
  but an earlier vertical gap can fit the part and its spacing
- **THEN** the part is placed in that gap below the top bar/chrome and
  above the bottom bar/chrome

#### Scenario: Full screen without a free gap
- **WHEN** no free gap can fit a new part whose dimensions fit the content
  area
- **THEN** automatic placement keeps the part inside the content area and
  screen bounds on the grid, allowing overlap instead of clipping
