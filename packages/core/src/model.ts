/* Document model for SwiftUI Canvas.
 *
 * One JSON shape is the storage format, the file format, the share-link
 * payload and the prompt input:
 *
 *   Doc { version: 1, title, lang, theme, screens[], parts[] }
 *
 * Screens are fixed at 393x852 pt (iPhone logical points) for the MVP and
 * coordinates are points, laid out on an 8 pt grid.
 */

export type Lang = "en" | "ja" | "zh";

export const LANGS: Lang[] = ["en", "ja", "zh"];

export type Transition = "push" | "zoom" | "sheet" | "cover" | "none";

export const TRANSITIONS: Transition[] = ["push", "zoom", "sheet", "cover", "none"];

/** The part kinds of the MVP, as listed in MVP-DESIGN.md section 3.
 *  (The design text says "20 kinds" but its table enumerates these 24;
 *  all named kinds are implemented — see the build report.) */
export type Kind =
  | "navBar"
  | "tabBar"
  | "searchField"
  | "button"
  | "iconButton"
  | "menu"
  | "link"
  | "textField"
  | "secureField"
  | "toggle"
  | "slider"
  | "stepper"
  | "gauge"
  | "datePicker"
  | "colorPicker"
  | "segmented"
  | "picker"
  | "text"
  | "image"
  | "list"
  | "card"
  | "divider"
  | "progress"
  | "alert"
  | "sheet"
  | "box"
  | "contentUnavailable";

export const KIND_ORDER: Kind[] = [
  "navBar",
  "tabBar",
  "searchField",
  "button",
  "iconButton",
  "menu",
  "link",
  "textField",
  "secureField",
  "toggle",
  "slider",
  "stepper",
  "gauge",
  "datePicker",
  "colorPicker",
  "segmented",
  "picker",
  "text",
  "image",
  "list",
  "card",
  "divider",
  "progress",
  "alert",
  "sheet",
  "box",
  "contentUnavailable",
];

/** Kinds the parts palette shows, grouped for scanning. */
export const PALETTE_ORDER: Kind[] = [
  "navBar",
  "tabBar",
  "button",
  "iconButton",
  "list",
  "card",
  "toggle",
  "textField",
  "searchField",
  "segmented",
  "picker",
  "slider",
  "progress",
  "alert",
  "sheet",
  "text",
  "image",
  "divider",
  "box",
  "menu",
  "stepper",
  "gauge",
  "datePicker",
  "colorPicker",
  "secureField",
  "link",
  "contentUnavailable",
];

export type Variant =
  | "plain"
  | "bordered"
  | "borderedProminent"
  | "glass"
  | "glassProminent"
  | "roundedBorder"
  | "insetGrouped"
  | "plainList"
  | "large"
  | "inline"
  | "filled"
  | "stroke"
  | "background"
  | "secondary"
  | "tertiary"
  | "linear"
  | "circular"
  | "accessoryCircular"
  | "compact"
  | "largeTitle"
  | "title"
  | "headline"
  | "body"
  | "callout"
  | "footnote"
  | "caption";

/** Variants offered per kind; the first entry is the default. */
export const KIND_VARIANTS: Record<Kind, Variant[]> = {
  navBar: ["large", "inline"],
  tabBar: ["plain"],
  searchField: ["plain"],
  button: ["borderedProminent", "bordered", "glass", "glassProminent", "plain"],
  iconButton: ["glass", "bordered", "borderedProminent", "plain"],
  menu: ["bordered", "borderedProminent", "glass", "plain"],
  link: ["plain"],
  textField: ["roundedBorder", "plain"],
  secureField: ["roundedBorder", "plain"],
  toggle: ["plain"],
  slider: ["plain"],
  stepper: ["plain"],
  gauge: ["linear", "accessoryCircular"],
  datePicker: ["compact"],
  colorPicker: ["plain"],
  segmented: ["plain"],
  picker: ["plain"],
  text: ["body", "largeTitle", "title", "headline", "callout", "footnote", "caption"],
  image: ["plain"],
  list: ["insetGrouped", "plainList"],
  card: ["filled", "stroke"],
  divider: ["plain"],
  progress: ["linear", "circular"],
  alert: ["plain"],
  sheet: ["plain"],
  box: ["background", "secondary", "tertiary"],
  contentUnavailable: ["plain"],
};

export interface Option {
  label: string;
  /** SF Symbol name. */
  icon?: string | null;
  /** Screen id this option navigates to (tab rows, list rows). */
  target?: string | null;
}

export interface Link {
  /** A screen id, or BACK_TARGET. */
  target: string;
  transition: Transition;
}

export interface Part {
  id: string;
  /** The screen this part sits on, or null for a canvas-level part that
   *  never enters the prompt. */
  screen: string | null;
  kind: Kind;
  x: number;
  y: number;
  label: string;
  /** SF Symbol name. */
  icon?: string | null;
  supporting?: string;
  variant: Variant;
  options?: Option[];
  checked?: boolean;
  selected?: number;
  value?: number;
  displayedComponents?: "date" | "time" | "both";
  date?: string;
  color?: string;
  w?: number;
  h?: number;
  /** Free-form behaviour note; travels into the prompt. */
  note?: string;
  link?: Link;
  /** Id of an alert/sheet part on the same screen that this part presents. */
  presents?: string;
}

export type ScreenBg = "system" | "secondary" | "grouped" | (string & {});

export interface Screen {
  id: string;
  name: string;
  x: number;
  y: number;
  note?: string;
  /** A system token ("system" | "secondary" | "grouped") or a #hex colour. */
  bg?: ScreenBg;
  /** Draw system chrome: status bar (59 pt) + home indicator (34 pt). */
  chrome: boolean;
}

export interface Theme {
  /** Accent preset key (see ACCENT_PRESETS) or a #hex colour. */
  accent: string;
  scheme: "light" | "dark";
  shape: "default" | "capsule";
  font: "system" | "rounded" | "serif" | "monospaced";
}

export interface Doc {
  version: 1;
  title: string;
  lang: Lang;
  theme: Theme;
  screens: Screen[];
  parts: Part[];
}

export const BACK_TARGET = "back";
export const SCREEN_W = 393;
export const SCREEN_H = 852;
export const CHROME_TOP = 59;
export const CHROME_BOTTOM = 34;
export const MARGIN = 16;
export const GRID = 8;

export const SCREEN_BGS = ["system", "secondary", "grouped"] as const;

export const ACCENT_PRESETS: { key: string; hex: string }[] = [
  { key: "blue", hex: "#007AFF" },
  { key: "purple", hex: "#AF52DE" },
  { key: "pink", hex: "#FF2D55" },
  { key: "red", hex: "#FF3B30" },
  { key: "orange", hex: "#FF9500" },
  { key: "yellow", hex: "#FFCC00" },
  { key: "green", hex: "#34C759" },
  { key: "teal", hex: "#5AC8FA" },
  { key: "indigo", hex: "#5856D6" },
  { key: "gray", hex: "#8E8E93" },
];

export const DEFAULT_THEME: Theme = {
  accent: "blue",
  scheme: "light",
  shape: "default",
  font: "system",
};

export function accentHex(theme: Theme): string {
  const preset = ACCENT_PRESETS.find((p) => p.key === theme.accent);
  if (preset) return preset.hex;
  return /^#[0-9a-fA-F]{6}$/.test(theme.accent) ? theme.accent : "#007AFF";
}

/** Short random id (not a secret; only needs to be unique in a document). */
export function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID().replace(/-/g, "").slice(0, 12);
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

export function variantOf(part: Pick<Part, "kind" | "variant">): Variant {
  const allowed = KIND_VARIANTS[part.kind];
  return allowed.includes(part.variant) ? part.variant : (allowed[0] as Variant);
}

/** Default on-screen size (pt) for a kind, before any explicit w/h. */
export function partSize(kind: Kind, part?: Partial<Part>): { w: number; h: number } {
  switch (kind) {
    case "navBar":
      return { w: SCREEN_W, h: part?.variant === "inline" ? 54 : 96 };
    case "tabBar":
      return { w: 361, h: 62 };
    case "searchField":
      return { w: 361, h: 36 };
    case "button":
      return { w: 361, h: 50 };
    case "iconButton":
      return { w: 44, h: 44 };
    case "menu":
      return { w: 180, h: 44 };
    case "link":
      return { w: 120, h: 22 };
    case "textField":
    case "secureField":
      return { w: 361, h: 44 };
    case "toggle":
      return { w: 361, h: 31 };
    case "slider":
      return { w: 361, h: 28 };
    case "stepper":
      return { w: 361, h: 32 };
    case "gauge":
      return part?.variant === "accessoryCircular" ? { w: 80, h: 80 } : { w: 361, h: 48 };
    case "datePicker":
    case "colorPicker":
      return { w: 361, h: 44 };
    case "segmented":
      return { w: 361, h: 32 };
    case "picker":
      return { w: 361, h: 44 };
    case "text": {
      const sizes: Record<string, number> = {
        largeTitle: 41,
        title: 34,
        headline: 22,
        body: 22,
        callout: 21,
        footnote: 18,
        caption: 16,
      };
      return { w: 361, h: sizes[part?.variant ?? "body"] ?? 22 };
    }
    case "image":
      return { w: 361, h: 200 };
    case "list":
      return { w: 361, h: 176 };
    case "card":
      return { w: 361, h: 140 };
    case "divider":
      return { w: 361, h: 1 };
    case "progress":
      return part?.variant === "circular" ? { w: 44, h: 44 } : { w: 361, h: 6 };
    case "alert":
      return { w: 270, h: 180 };
    case "sheet":
      return { w: SCREEN_W, h: 260 };
    case "box":
      return { w: 361, h: 220 };
    case "contentUnavailable":
      return { w: 361, h: 200 };
  }
}

const DEFAULT_LABELS: Record<Lang, Partial<Record<Kind, string>>> = {
  en: {
    button: "Continue",
    toggle: "Notifications",
    textField: "Name",
    secureField: "Password",
    searchField: "Search",
    navBar: "Home",
    text: "Text",
    card: "Card title",
    list: "",
    link: "Learn more",
    menu: "Options",
    stepper: "Quantity",
    gauge: "Battery level",
    datePicker: "Starts",
    colorPicker: "Color",
    picker: "Sort by",
    contentUnavailable: "Nothing here yet",
    alert: "Delete item?",
    sheet: "Details",
  },
  ja: {
    button: "続ける",
    toggle: "通知",
    textField: "名前",
    secureField: "パスワード",
    searchField: "検索",
    navBar: "ホーム",
    text: "テキスト",
    card: "カードのタイトル",
    list: "",
    link: "詳しく見る",
    menu: "オプション",
    stepper: "数量",
    gauge: "バッテリー残量",
    datePicker: "開始",
    colorPicker: "カラー",
    picker: "並び替え",
    contentUnavailable: "まだ何もありません",
    alert: "削除しますか？",
    sheet: "詳細",
  },
  zh: {
    button: "继续",
    toggle: "通知",
    textField: "姓名",
    secureField: "密码",
    searchField: "搜索",
    navBar: "首页",
    text: "文本",
    card: "卡片标题",
    list: "",
    link: "了解更多",
    menu: "选项",
    stepper: "数量",
    gauge: "电池电量",
    datePicker: "开始",
    colorPicker: "颜色",
    picker: "排序",
    contentUnavailable: "这里还没有内容",
    alert: "要删除吗？",
    sheet: "详情",
  },
};

function defaultOptions(lang: Lang, kind: Kind): Option[] | undefined {
  const words: Record<Lang, [string, string, string]> = {
    en: ["One", "Two", "Three"],
    ja: ["1つ目", "2つ目", "3つ目"],
    zh: ["一", "二", "三"],
  };
  const w = words[lang];
  switch (kind) {
    case "segmented":
    case "picker":
    case "menu":
      return w.map((label) => ({ label }));
    case "tabBar":
      return [
        { label: lang === "ja" ? "ホーム" : lang === "zh" ? "首页" : "Home", icon: "house" },
        { label: lang === "ja" ? "検索" : lang === "zh" ? "搜索" : "Search", icon: "magnifyingglass" },
        { label: lang === "ja" ? "設定" : lang === "zh" ? "设置" : "Settings", icon: "gearshape" },
      ];
    case "list":
      return w.map((label, i) => ({ label: `${label}`, icon: i === 0 ? "star" : null }));
    case "alert":
      return [
        { label: lang === "ja" ? "キャンセル" : lang === "zh" ? "取消" : "Cancel" },
        { label: lang === "ja" ? "削除" : lang === "zh" ? "删除" : "Delete" },
      ];
    default:
      return undefined;
  }
}

export function defaultPart(lang: Lang, screenId: string | null, kind: Kind, x: number, y: number): Part {
  const variant = (KIND_VARIANTS[kind][0] ?? "plain") as Variant;
  const size = partSize(kind, { variant });
  const part: Part = {
    id: newId(),
    screen: screenId,
    kind,
    x,
    y,
    label: DEFAULT_LABELS[lang][kind] ?? "",
    variant,
    w: size.w,
    h: size.h,
  };
  const options = defaultOptions(lang, kind);
  if (options) part.options = options;
  if (kind === "toggle") part.checked = true;
  if (kind === "slider" || kind === "progress") part.value = 40;
  if (kind === "stepper") part.value = 1;
  if (kind === "gauge") part.value = 0.65;
  if (kind === "datePicker") {
    part.displayedComponents = "both";
    part.date = "2026-11-21T09:41";
  }
  if (kind === "colorPicker") part.color = "#007AFF";
  if (kind === "segmented" || kind === "picker" || kind === "menu" || kind === "tabBar") part.selected = 0;
  if (kind === "card") part.supporting = lang === "ja" ? "カードの本文テキスト" : lang === "zh" ? "卡片正文" : "Supporting text for the card.";
  if (kind === "alert") part.supporting = lang === "ja" ? "この操作は取り消せません" : lang === "zh" ? "此操作无法撤销" : "This action cannot be undone.";
  if (kind === "contentUnavailable") {
    part.icon = "tray";
    part.supporting = lang === "ja" ? "新しい項目を追加するとここに表示されます" : lang === "zh" ? "添加新项目后会显示在这里" : "New items will appear here.";
  }
  if (kind === "image") part.icon = "photo";
  return part;
}

export function newScreen(lang: Lang, index: number, x = 0, y = 0): Screen {
  return {
    id: newId(),
    name: lang === "ja" ? `画面 ${index + 1}` : lang === "zh" ? `页面 ${index + 1}` : `Screen ${index + 1}`,
    x,
    y,
    chrome: true,
    bg: "system",
  };
}

export function newDoc(lang: Lang = "en"): Doc {
  const screen = newScreen(lang, 0, 0, 0);
  const nav = defaultPart(lang, screen.id, "navBar", 0, CHROME_TOP);
  const tabs = defaultPart(lang, screen.id, "tabBar", MARGIN, SCREEN_H - CHROME_BOTTOM - 62 - 8);
  const title = defaultPart(lang, screen.id, "text", MARGIN, 180);
  title.variant = "largeTitle";
  title.label = lang === "ja" ? "ようこそ" : lang === "zh" ? "欢迎" : "Welcome";
  const button = defaultPart(lang, screen.id, "button", MARGIN, 260);
  button.variant = "glassProminent";
  return {
    version: 1,
    title: lang === "ja" ? "無題のアプリ" : lang === "zh" ? "未命名应用" : "Untitled App",
    lang,
    theme: { ...DEFAULT_THEME },
    screens: [screen],
    parts: [nav, title, button, tabs],
  };
}

export const partsOf = (doc: Doc, screenId: string): Part[] => doc.parts.filter((p) => p.screen === screenId);

export const screenById = (doc: Doc, id: string): Screen | undefined => doc.screens.find((s) => s.id === id);

export const screenName = (doc: Doc, id: string, fallback = "?"): string =>
  id === BACK_TARGET ? "back" : (screenById(doc, id)?.name ?? fallback);

export function duplicatePart(part: Part, id: string = newId()): Part {
  return {
    ...part,
    id,
    options: part.options?.map((o) => ({ ...o })),
    link: part.link ? { ...part.link } : undefined,
  };
}

export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
