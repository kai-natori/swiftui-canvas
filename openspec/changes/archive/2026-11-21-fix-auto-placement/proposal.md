# Proposal

## Why

Automatic placement counts the tab bar as ordinary stacked content, so
catalog and palette click-add can create a part below the screen's content
area. Palette dragging is also blocked in Chrome when the palette's CSS
reset overrides native draggable behavior.

## What Changes

- Share content-aware automatic placement between catalog "Add to editor"
  and palette click-add.
- Reserve system chrome and navigation/tab bars, retain 16pt margins and
  spacing on the 8pt grid, and reuse earlier gaps when appending would clip.
- When no free gap fits, allow overlap rather than placing a fitting part
  below the content area.
- Restore native palette drag initiation in Chrome. Explicit drops retain
  their existing pointer-relative, grid-snapped placement instead of
  invoking automatic stacking.

## Capabilities

### Modified Capabilities
- `canvas-editor`: part addition, automatic placement and explicit drops.

## Impact

- Code: `Editor.tsx`, `editor-logic.ts`, and palette styles.
- Verification: placement unit tests and real Chrome palette drag.
- No document format, dependency, prompt, or persistence changes.
