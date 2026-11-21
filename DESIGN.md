# SwiftUI Canvas workspace

The workspace is a native-feeling design tool for people assembling iOS
screens and exporting implementation briefs. The user's visual direction
is Xcode and Apple's Mac applications.

## Composition

- A compact, neutral toolbar for project, history, share, prompt and run.
- A leading navigator for screens and layers, with a searchable component library.
- A quiet canvas with a device-size breadcrumb and contextual controls.
- A trailing inspector with separate properties and appearance tabs.
- At narrow widths, panels become dismissible sheets. The canvas always
  retains the available width; editing never requires two fixed sidebars.

Reference: Apple's “Getting Started with Xcode” (WWDC19/404) and
“Inspectors in SwiftUI: Discover the details” (WWDC23/10161). Their
navigator/editor/inspector hierarchy and compact-size inspector presentation
guide this implementation. No generated image or pixel-identical target
is available; validate the actual browser renders.

## Visual contract

Use the macOS system font stack. Workspace type is 11–14px, with 12–13px
controls and 600 weight for section titles. Use neutral white and gray
surfaces, subtle separators, and system blue for selection and primary
actions. Corner radii: 4, 6, 8, 12 and 16px, plus full capsules for iOS
controls and the established 44px device corners.

The editor's interface is quiet and opaque. Liquid Glass belongs to the
iOS designs and material experiments, where the background demonstrates
refraction. Avoid decorative pastel gradients, oversized pill toolbars,
fake window controls and nonfunctional controls.

## Behavior and verification

Native input controls in preview keep state isolated from the saved
design. Dialogs trap focus, restore it on close, and support Escape.
All actions remain reachable by keyboard and at 390px width.
Honor reduced motion. Show actionable file, image and storage errors.

Verify 1440px desktop, 1024px tablet and 390px phone layouts, Japanese
labels, both canvas appearances, all 27 part kinds, keyboard interactions,
navigation/presentation, autosave, JSON, share and prompt generation.
