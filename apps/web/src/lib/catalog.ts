import {
  KIND_ORDER,
  type KeyValueStorage,
  type Kind,
  type Lang,
} from "@swiftui-canvas/core";

import { KIND_NAMES, type StringKey } from "./i18n";

/* The Components catalog taxonomy.
 *
 * Categories follow Apple's own organisation, not an invented one:
 * the SwiftUI documentation's Topics (developer.apple.com/documentation/
 * swiftui) group views under "Controls and indicators", "Menus and
 * commands", "Text input and output" and "Images" (Views), "Lists" and
 * "View groupings" (View layout), and "Navigation", "Toolbars", "Search"
 * and "Modal presentations" (App structure); the Human Interface
 * Guidelines group components the same way (Navigation and search,
 * Menus and actions, Presentation, Selection and input, Content).
 *
 * Each part kind maps to the SwiftUI view it generates. Kinds that are
 * not a single SwiftUI view are flagged `composite` and name the views
 * they compose, rather than pretending to be one API.
 */

export type CategoryId =
  | "navigation"
  | "controls"
  | "menus"
  | "text"
  | "images"
  | "layout"
  | "presentation";

export interface CatalogCategory {
  id: CategoryId;
  /** i18n key for the category name (mirrors Apple's topic wording). */
  nameKey: StringKey;
  /** Where the grouping comes from, shown as a small source note. */
  source: string;
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { id: "navigation", nameKey: "catalog.cat.navigation", source: "SwiftUI docs · App structure — Navigation, Toolbars, Search" },
  { id: "controls", nameKey: "catalog.cat.controls", source: "SwiftUI docs · Views — Controls and indicators" },
  { id: "menus", nameKey: "catalog.cat.menus", source: "SwiftUI docs · Views — Menus and commands" },
  { id: "text", nameKey: "catalog.cat.text", source: "SwiftUI docs · Views — Text input and output" },
  { id: "images", nameKey: "catalog.cat.images", source: "SwiftUI docs · Views — Images" },
  { id: "layout", nameKey: "catalog.cat.layout", source: "SwiftUI docs · View layout — Lists, View groupings" },
  { id: "presentation", nameKey: "catalog.cat.presentation", source: "SwiftUI docs · App structure — Modal presentations" },
];

export interface CatalogEntry {
  kind: Kind;
  category: CategoryId;
  /** The SwiftUI view (or presentation) this part generates — the
   *  primary label on the catalog page, in Apple's naming. */
  swift: string;
  /** True when the part composes several SwiftUI views instead of
   *  mapping to one; `swift` then names the composition. */
  composite?: boolean;
  /** i18n key for the one-line description. */
  descKey: StringKey;
}

export const CATALOG: CatalogEntry[] = [
  // Navigation & search — NavigationStack chrome, tab bar, search, links.
  { kind: "navBar", category: "navigation", swift: "NavigationStack", descKey: "catalog.desc.navBar" },
  { kind: "tabBar", category: "navigation", swift: "TabView", descKey: "catalog.desc.tabBar" },
  { kind: "searchField", category: "navigation", swift: ".searchable", descKey: "catalog.desc.searchField" },
  { kind: "link", category: "navigation", swift: "NavigationLink", descKey: "catalog.desc.link" },
  // Controls and indicators.
  { kind: "button", category: "controls", swift: "Button", descKey: "catalog.desc.button" },
  { kind: "iconButton", category: "controls", swift: "Button", composite: true, descKey: "catalog.desc.iconButton" },
  { kind: "toggle", category: "controls", swift: "Toggle", descKey: "catalog.desc.toggle" },
  { kind: "slider", category: "controls", swift: "Slider", descKey: "catalog.desc.slider" },
  { kind: "stepper", category: "controls", swift: "Stepper", descKey: "catalog.desc.stepper" },
  { kind: "gauge", category: "controls", swift: "Gauge", descKey: "catalog.desc.gauge" },
  { kind: "datePicker", category: "controls", swift: "DatePicker", descKey: "catalog.desc.datePicker" },
  { kind: "colorPicker", category: "controls", swift: "ColorPicker", descKey: "catalog.desc.colorPicker" },
  { kind: "segmented", category: "controls", swift: "Picker", composite: true, descKey: "catalog.desc.segmented" },
  { kind: "picker", category: "controls", swift: "Picker", descKey: "catalog.desc.picker" },
  { kind: "progress", category: "controls", swift: "ProgressView", descKey: "catalog.desc.progress" },
  // Menus and commands.
  { kind: "menu", category: "menus", swift: "Menu", descKey: "catalog.desc.menu" },
  // Text input and output.
  { kind: "textField", category: "text", swift: "TextField", descKey: "catalog.desc.textField" },
  { kind: "secureField", category: "text", swift: "SecureField", descKey: "catalog.desc.secureField" },
  { kind: "text", category: "text", swift: "Text", descKey: "catalog.desc.text" },
  // Images.
  { kind: "image", category: "images", swift: "Image", descKey: "catalog.desc.image" },
  // Lists & layout.
  { kind: "list", category: "layout", swift: "List", descKey: "catalog.desc.list" },
  { kind: "card", category: "layout", swift: "VStack in a container", composite: true, descKey: "catalog.desc.card" },
  { kind: "box", category: "layout", swift: "ZStack background", composite: true, descKey: "catalog.desc.box" },
  { kind: "divider", category: "layout", swift: "Divider", descKey: "catalog.desc.divider" },
  { kind: "contentUnavailable", category: "layout", swift: "ContentUnavailableView", descKey: "catalog.desc.contentUnavailable" },
  // Modal presentation.
  { kind: "alert", category: "presentation", swift: ".alert", descKey: "catalog.desc.alert" },
  { kind: "sheet", category: "presentation", swift: ".sheet", descKey: "catalog.desc.sheet" },
];

/** SwiftUI views from Apple's catalog that are not parts yet. Every
 *  name here is a documented SwiftUI view (Controls and indicators,
 *  View groupings, Lists/Tables topics, or a sibling framework's
 *  SwiftUI surface: Charts, MapKit, PhotosUI). */
export interface NotYetEntry {
  swift: string;
  category: CategoryId;
}

export const NOT_YET: NotYetEntry[] = [
  { swift: "MultiDatePicker", category: "controls" },
  { swift: "Form", category: "layout" },
  { swift: "Table", category: "layout" },
  { swift: "DisclosureGroup", category: "layout" },
  { swift: "NavigationSplitView", category: "navigation" },
  { swift: "Chart (Swift Charts)", category: "images" },
  { swift: "Map (MapKit)", category: "images" },
  { swift: "WebView", category: "images" },
  { swift: "PhotosPicker (PhotosUI)", category: "images" },
];

export function entryForKind(kind: Kind): CatalogEntry {
  const entry = CATALOG.find((e) => e.kind === kind);
  if (!entry) throw new Error(`no catalog entry for kind ${kind}`);
  return entry;
}

/** Filter the catalog by category and a free-text query. The query
 *  matches the SwiftUI name, the part kind id, and the part's display
 *  name in every language (so searching works across UI languages). */
export function filterCatalog(
  category: CategoryId | "all",
  query: string,
): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  return CATALOG.filter((entry) => {
    if (category !== "all" && entry.category !== category) return false;
    if (!q) return true;
    const names = (Object.keys(KIND_NAMES) as Lang[]).map((l) => KIND_NAMES[l][entry.kind]);
    const haystack = [entry.swift, entry.kind, ...names].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

/** Catalog order is the canonical kind order filtered to entries, so
 *  the page and the palette never drift apart. */
export function catalogKinds(): Kind[] {
  return KIND_ORDER.filter((k) => CATALOG.some((e) => e.kind === k));
}

/* ---- "Add to editor" hand-off ---------------------------------------
 * The catalog page stashes the chosen kind; the editor consumes it on
 * load and adds the part to its first screen. One-shot: taking clears
 * the stash. */

export const PENDING_PART_KEY = "swiftui-canvas:pending-part:v1";

export function stashPendingPart(storage: KeyValueStorage, kind: Kind): void {
  storage.setItem(PENDING_PART_KEY, kind);
}

export function takePendingPart(storage: KeyValueStorage): Kind | null {
  const raw = storage.getItem(PENDING_PART_KEY);
  if (raw === null) return null;
  storage.removeItem(PENDING_PART_KEY);
  return (KIND_ORDER as string[]).includes(raw) ? (raw as Kind) : null;
}
