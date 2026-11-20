import {
  BACK_TARGET,
  accentHex,
  partsOf,
  screenName,
  variantOf,
  type Doc,
  type Lang,
  type Part,
  type Screen,
} from "@swiftui-canvas/core";

/* Prompt generation (prompt-export spec).
 *
 * A prompt is the whole design (or one screen) as a concise brief an AI
 * coding tool can build directly. The API baseline is fixed text with
 * identical API wording in en / ja / zh: iOS 26, NavigationStack,
 * TabView + Tab, @Observable, foregroundStyle, Liquid Glass APIs,
 * SF Symbols verbatim, copy verbatim.
 */

const hasText = (s?: string | null): boolean => !!s && s.trim().length > 0;

const q = (lang: Lang, s: string): string => (lang === "zh" ? `“${s.trim()}”` : `"${s.trim()}"`);

function label(lang: Lang, s?: string | null): string {
  if (hasText(s)) return q(lang, s as string);
  return lang === "ja" ? "（文字なし）" : lang === "zh" ? "（无文字）" : "(no text)";
}

/* ---------- fixed API baseline (identical API wording, 3 languages) --- */

export function apiBaseline(lang: Lang): string {
  if (lang === "ja") {
    return [
      "## API baseline",
      "SwiftUIで実装すること。deployment target は iOS 26.0、Swift 6.2 / 最新SDKを使い、モダンなAPIのみを使う：",
      "- ナビゲーションは NavigationStack と TabView + Tab を使う（廃止された NavigationView は使わない）。検索は .searchable を使う。",
      "- 画面上部にはシステムのステータスバー（約59pt）、下部にはホームインジケータ（約34pt）の安全領域を空ける。自分で実装せず、安全領域を尊重するだけでよい。",
      "- ツールバーとバー内のボタンは iOS 26 で自動的に Liquid Glass になる。カスタムのガラス要素には .glassEffect()、GlassEffectContainer、buttonStyle(.glass) / (.glassProminent) を使う。",
      "- スクロールの端の表現には .scrollEdgeEffectStyle を使う。ズーム遷移は .navigationTransition(.zoom(sourceID:in:)) を使う。",
      "- 状態のモデルは @Observable で表す。色は foregroundStyle で付ける（foregroundColor は使わない）。",
      "- アイコンはすべて SF Symbols とし、プロンプトに書かれた名前をそのまま Image(systemName:) に入れる。",
      "- 表示文字列はプロンプトに書かれた原文をそのまま使う（翻訳しない）。アイコンのみのボタンには VoiceOver 用のラベルを付ける。",
    ].join("\n");
  }
  if (lang === "zh") {
    return [
      "## API baseline",
      "用 SwiftUI 实现，deployment target 为 iOS 26.0，Swift 6.2 / 最新 SDK，只使用现代 API：",
      "- 导航使用 NavigationStack 与 TabView + Tab（不要使用已废弃的 NavigationView）；搜索使用 .searchable。",
      "- 屏幕顶部留出系统状态栏（约 59pt），底部留出主屏指示条（约 34pt）的安全区域；不需要自己实现，尊重安全区域即可。",
      "- 工具栏与栏内按钮在 iOS 26 会自动呈现 Liquid Glass；自定义玻璃元素使用 .glassEffect()、GlassEffectContainer、buttonStyle(.glass) / (.glassProminent)。",
      "- 滚动边缘效果使用 .scrollEdgeEffectStyle；缩放过渡使用 .navigationTransition(.zoom(sourceID:in:))。",
      "- 状态模型使用 @Observable；颜色使用 foregroundStyle（不要使用 foregroundColor）。",
      "- 图标一律使用 SF Symbols，将提示词中给出的名称原样放入 Image(systemName:)。",
      "- 显示文字使用提示词给出的原文（不要翻译）；仅图标按钮要补上 VoiceOver 标签。",
    ].join("\n");
  }
  return [
    "## API baseline",
    "Build it in SwiftUI with a deployment target of iOS 26.0, Swift 6.2 on the latest SDK. Modern APIs only:",
    "- Navigate with NavigationStack and TabView + Tab (never the deprecated NavigationView); search with .searchable.",
    "- Leave room for the system status bar (~59pt) at the top and the home indicator (~34pt) at the bottom; do not build them yourself, just respect the safe areas.",
    "- Toolbar and bar buttons render as Liquid Glass automatically on iOS 26; for custom glass controls use .glassEffect(), GlassEffectContainer, buttonStyle(.glass) or (.glassProminent).",
    "- Use .scrollEdgeEffectStyle for scroll edge effects. Zoom transitions use .navigationTransition(.zoom(sourceID:in:)).",
    "- Model state with @Observable; colour views with foregroundStyle (not foregroundColor).",
    "- All icons are SF Symbols: put the given names verbatim into Image(systemName:).",
    "- Use the exact strings given in this prompt for all labels (do not translate them); give icon-only controls accessibility labels.",
  ].join("\n");
}

/* ---------- localised scaffolding ------------------------------------ */

interface Strings {
  overview: (title: string, nScreens: number, nParts: number) => string;
  theme: string;
  accent: (r: number, g: number, b: number) => string;
  appearance: (dark: boolean) => string;
  fontDesign: (font: Doc["theme"]["font"]) => string;
  shape: (capsule: boolean) => string;
  screens: string;
  screen: (name: string) => string;
  screenNote: (note: string) => string;
  background: (bg: string) => string;
  navigation: string;
  noNavigation: string;
  opens: (from: string, to: string, transition: string) => string;
  presents: (from: string, what: string) => string;
  note: (note: string) => string;
  value: (v: number) => string;
  on: string;
  off: string;
  selected: (i: number) => string;
  withIcon: (icon: string) => string;
  options: (list: string) => string;
}

const STRINGS: Record<Lang, Strings> = {
  en: {
    overview: (t, n, p) =>
      `Implement the app "${t}" in SwiftUI from the screen designs below. It has ${n} screen${n === 1 ? "" : "s"} and ${p} parts in total. Build every screen as its own View and wire up the navigation exactly as described.`,
    theme: "## Theme",
    accent: (r, g, b) => `- Accent: Color(red: ${(r / 255).toFixed(3)}, green: ${(g / 255).toFixed(3)}, blue: ${(b / 255).toFixed(3)}); apply it with .tint on the root.`,
    appearance: (dark) => `- Appearance: ${dark ? "dark (.preferredColorScheme(.dark))" : "light (.preferredColorScheme(.light))"}.`,
    fontDesign: (f) => (f === "system" ? "- Font: system default." : `- Font design: .fontDesign(.${f}).`),
    shape: (c) => `- Shape: ${c ? "capsule shapes (.clipShape(Capsule()) where fitting)" : "default rounded corners"}.`,
    screens: "## Screens",
    screen: (name) => `### Screen: ${name}`,
    screenNote: (n) => `Screen note: ${n}`,
    background: (bg) => `Background: ${bg}.`,
    navigation: "## Navigation and behaviour",
    noNavigation: "No navigation links are defined.",
    opens: (from, to, t) => `- ${from} opens ${to} (transition: ${t}).`,
    presents: (from, what) => `- ${from} presents ${what}.`,
    note: (n) => `Behaviour: ${n}`,
    value: (v) => `value ${v}%`,
    on: "on",
    off: "off",
    selected: (i) => `, initially selected: #${i + 1}`,
    withIcon: (icon) => ` with the SF Symbol ${icon}`,
    options: (list) => `: ${list}`,
  },
  ja: {
    overview: (t, n, p) =>
      `アプリ「${t}」を、以下の画面設計どおりに SwiftUI で実装してください。画面は ${n} 枚、部品は合計 ${p} 個です。各画面を個別の View として作り、遷移は説明どおりに配線してください。`,
    theme: "## テーマ",
    accent: (r, g, b) => `- 強調色: Color(red: ${(r / 255).toFixed(3)}, green: ${(g / 255).toFixed(3)}, blue: ${(b / 255).toFixed(3)})。ルートに .tint で適用する。`,
    appearance: (dark) => `- 外観: ${dark ? "ダーク（.preferredColorScheme(.dark)）" : "ライト（.preferredColorScheme(.light)）"}。`,
    fontDesign: (f) => (f === "system" ? "- フォント: システム標準。" : `- フォントデザイン: .fontDesign(.${f})。`),
    shape: (c) => `- 形状: ${c ? "カプセル形（適する場所では .clipShape(Capsule())）" : "標準の角丸"}。`,
    screens: "## 画面",
    screen: (name) => `### 画面: ${name}`,
    screenNote: (n) => `画面メモ: ${n}`,
    background: (bg) => `背景: ${bg}。`,
    navigation: "## 遷移と振る舞い",
    noNavigation: "遷移リンクは定義されていません。",
    opens: (from, to, t) => `- ${from} は ${to} を開く（遷移: ${t}）。`,
    presents: (from, what) => `- ${from} は ${what} を表示する。`,
    note: (n) => `振る舞い: ${n}`,
    value: (v) => `値 ${v}%`,
    on: "オン",
    off: "オフ",
    selected: (i) => `、初期選択: ${i + 1} 番目`,
    withIcon: (icon) => `（SF Symbol: ${icon}）`,
    options: (list) => `: ${list}`,
  },
  zh: {
    overview: (t, n, p) =>
      `请按照下面的屏幕设计，用 SwiftUI 实现应用“${t}”。共 ${n} 个屏幕、${p} 个组件。每个屏幕做成独立的 View，跳转严格按说明连接。`,
    theme: "## 主题",
    accent: (r, g, b) => `- 强调色：Color(red: ${(r / 255).toFixed(3)}, green: ${(g / 255).toFixed(3)}, blue: ${(b / 255).toFixed(3)})，在根视图用 .tint 应用。`,
    appearance: (dark) => `- 外观：${dark ? "深色（.preferredColorScheme(.dark)）" : "浅色（.preferredColorScheme(.light)）"}。`,
    fontDesign: (f) => (f === "system" ? "- 字体：系统默认。" : `- 字体设计：.fontDesign(.${f})。`),
    shape: (c) => `- 形状：${c ? "胶囊形（合适处使用 .clipShape(Capsule())）" : "默认圆角"}。`,
    screens: "## 屏幕",
    screen: (name) => `### 屏幕: ${name}`,
    screenNote: (n) => `屏幕备注: ${n}`,
    background: (bg) => `背景: ${bg}。`,
    navigation: "## 跳转与行为",
    noNavigation: "没有定义跳转链接。",
    opens: (from, to, t) => `- ${from} 打开 ${to}（过渡: ${t}）。`,
    presents: (from, what) => `- ${from} 弹出 ${what}。`,
    note: (n) => `行为: ${n}`,
    value: (v) => `值 ${v}%`,
    on: "开",
    off: "关",
    selected: (i) => `，初始选中第 ${i + 1} 项`,
    withIcon: (icon) => `（SF Symbol ${icon}）`,
    options: (list) => `：${list}`,
  },
};

/* ---------- per-part descriptions ------------------------------------- */

const KIND_NOUN: Record<Lang, Record<Part["kind"], string>> = {
  en: {
    navBar: "Navigation bar",
    tabBar: "Tab bar (TabView)",
    searchField: "Search field (.searchable)",
    button: "Button",
    iconButton: "Icon button",
    menu: "Menu button",
    link: "Link",
    textField: "TextField",
    secureField: "SecureField",
    toggle: "Toggle",
    slider: "Slider",
    stepper: "Stepper",
    segmented: "Segmented Picker",
    picker: "Menu Picker",
    text: "Text",
    image: "Image placeholder",
    list: "List",
    card: "Card",
    divider: "Divider",
    progress: "ProgressView",
    alert: "Alert (.alert)",
    sheet: "Sheet (.sheet)",
    box: "Rounded rectangle container",
    contentUnavailable: "ContentUnavailableView",
  },
  ja: {
    navBar: "ナビゲーションバー",
    tabBar: "タブバー（TabView）",
    searchField: "検索フィールド（.searchable）",
    button: "ボタン",
    iconButton: "アイコンボタン",
    menu: "メニューボタン",
    link: "リンク",
    textField: "TextField",
    secureField: "SecureField",
    toggle: "Toggle",
    slider: "Slider",
    stepper: "Stepper",
    segmented: "セグメント Picker",
    picker: "メニュー Picker",
    text: "テキスト",
    image: "画像プレースホルダ",
    list: "List",
    card: "カード",
    divider: "Divider",
    progress: "ProgressView",
    alert: "アラート（.alert）",
    sheet: "シート（.sheet）",
    box: "角丸のコンテナ",
    contentUnavailable: "ContentUnavailableView",
  },
  zh: {
    navBar: "导航栏",
    tabBar: "标签栏（TabView）",
    searchField: "搜索框（.searchable）",
    button: "按钮",
    iconButton: "图标按钮",
    menu: "菜单按钮",
    link: "链接",
    textField: "TextField",
    secureField: "SecureField",
    toggle: "Toggle 开关",
    slider: "Slider 滑块",
    stepper: "Stepper 步进器",
    segmented: "分段 Picker",
    picker: "菜单 Picker",
    text: "文本",
    image: "图片占位",
    list: "List 列表",
    card: "卡片",
    divider: "Divider 分隔线",
    progress: "ProgressView 进度",
    alert: "提醒（.alert）",
    sheet: "半屏页（.sheet）",
    box: "圆角容器",
    contentUnavailable: "ContentUnavailableView 空状态",
  },
};

function optionsText(lang: Lang, part: Part, doc: Doc, s: Strings): string {
  if (!part.options || part.options.length === 0) return "";
  const list = part.options
    .map((o) => {
      const target =
        o.target && (part.kind === "tabBar" || part.kind === "list")
          ? ` → ${o.target === BACK_TARGET ? "back" : screenName(doc, o.target)}`
          : "";
      return `${q(lang, o.label || "")}${o.icon ? ` (${o.icon})` : ""}${target}`;
    })
    .join(", ");
  return s.options(list);
}

export function describePart(lang: Lang, part: Part, doc: Doc): string {
  const s = STRINGS[lang];
  const it: Part = { ...part, variant: variantOf(part) };
  const noun = KIND_NOUN[lang][it.kind];
  const bits: string[] = [`${noun} ${label(lang, it.label)}`];
  bits.push(`style: ${it.variant}`);
  if (it.icon && it.kind !== "tabBar") bits.push(s.withIcon(it.icon).trim());
  if (hasText(it.supporting)) bits.push(label(lang, it.supporting));
  if (it.checked !== undefined && it.kind === "toggle") bits.push(it.checked ? s.on : s.off);
  if (it.value !== undefined && (it.kind === "slider" || it.kind === "progress")) {
    bits.push(s.value(it.value));
  }
  if (it.value !== undefined && it.kind === "stepper") bits.push(`${it.value}`);
  bits.push(optionsText(lang, it, doc, s));
  if (it.selected !== undefined && (it.kind === "segmented" || it.kind === "picker" || it.kind === "menu" || it.kind === "tabBar")) {
    bits.push(s.selected(it.selected).replace(/^[、,]\s*/, ""));
  }
  if (it.w !== undefined && it.h !== undefined && (it.kind === "image" || it.kind === "box" || it.kind === "card")) {
    bits.push(`${it.w}×${it.h}pt`);
  }
  let line = `- ${bits.filter((b) => b.length > 0).join(", ")}`;
  if (hasText(it.note)) line += `\n  ${s.note(it.note as string)}`;
  return line;
}

/* ---------- document → prompt ----------------------------------------- */

function themeText(doc: Doc, s: Strings): string {
  const hex = accentHex(doc.theme);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [
    s.theme,
    s.accent(r, g, b),
    s.appearance(doc.theme.scheme === "dark"),
    s.fontDesign(doc.theme.font),
    s.shape(doc.theme.shape === "capsule"),
  ].join("\n");
}

function screenText(lang: Lang, doc: Doc, screen: Screen, s: Strings): string {
  const lines: string[] = [s.screen(screen.name)];
  if (hasText(screen.note)) lines.push(s.screenNote(screen.note as string));
  if (screen.bg && screen.bg !== "system") lines.push(s.background(screen.bg));
  const parts = partsOf(doc, screen.id)
    .slice()
    .sort((a, b) => a.y - b.y || a.x - b.x);
  for (const part of parts) lines.push(describePart(lang, part, doc));
  return lines.join("\n");
}

function navigationText(lang: Lang, doc: Doc, onlyScreenId: string | undefined, s: Strings): string {
  const lines: string[] = [s.navigation];
  let any = false;
  const describe = (p: Part) =>
    `${KIND_NOUN[lang][p.kind]} ${label(lang, p.label)} (${screenName(doc, p.screen ?? "", "?")})`;
  for (const part of doc.parts) {
    if (onlyScreenId && part.screen !== onlyScreenId) continue;
    if (part.link) {
      const to = part.link.target === BACK_TARGET ? "back" : screenName(doc, part.link.target);
      lines.push(s.opens(describe(part), to, part.link.transition));
      any = true;
    }
    if (part.presents) {
      const target = doc.parts.find((x) => x.id === part.presents);
      if (target) {
        lines.push(s.presents(describe(part), `${KIND_NOUN[lang][target.kind]} ${label(lang, target.label)}`));
        any = true;
      }
    }
    if (part.options) {
      for (const o of part.options) {
        if (!o.target) continue;
        const to = o.target === BACK_TARGET ? "back" : screenName(doc, o.target);
        lines.push(s.opens(`${describe(part)} / ${q(lang, o.label)}`, to, "push"));
        any = true;
      }
    }
  }
  if (!any) lines.push(s.noNavigation);
  return lines.join("\n");
}

export interface PromptOptions {
  lang?: Lang;
  /** Build the prompt for a single screen instead of the whole document. */
  screenId?: string;
}

export function buildPrompt(doc: Doc, options: PromptOptions = {}): string {
  const lang = options.lang ?? doc.lang;
  const s = STRINGS[lang];
  const screens = options.screenId ? doc.screens.filter((sc) => sc.id === options.screenId) : doc.screens;
  const partCount = options.screenId
    ? doc.parts.filter((p) => p.screen === options.screenId).length
    : doc.parts.filter((p) => p.screen !== null).length;
  return [
    `# ${doc.title}`,
    "",
    s.overview(doc.title, screens.length, partCount),
    "",
    themeText(doc, s),
    "",
    s.screens,
    "",
    screens.map((sc) => screenText(lang, doc, sc, s)).join("\n\n"),
    "",
    navigationText(lang, doc, options.screenId, s),
    "",
    apiBaseline(lang),
    "",
  ].join("\n");
}
