# SwiftUI Canvas — MVP設計（ゼロから版）
作成: 2026-11-20 / 状態: 本人の確認待ち（実装はOK後）

## 0. 確定事項
- 名前: SwiftUI Canvas（副題: Liquid Glassで組む、AIコーディング用プロンプト生成）
- 方針: ゼロから作る（フォークしない）。参考実装として M3E Canvas / 既存SwiftUI Canvas の仕様は読むが、コードは持ち込まない
- 差別化の核: (1) キャンバス上の Liquid Glass 再現、(2) ツール自体のUIも Liquid Glass（M3Eのサイト自体がM3Eであるのと同じメタ構造）
- 構成: Turborepo モノレポ、公開は Cloudflare Pages（プレビューURLで本人が確認 → 本番）
- ルール: GitHub Actions なし / テレメトリ無効化（TURBO_TELEMETRY_DISABLED=1 等）/ コミット名義 Kai Natori + Co-authored-by: Kinako トレーラー
- 開発方式: **OpenSpec駆動**（本人の訂正 2026-11-20: OpenCodeではなくOpenSpec）。Muse（Kinako）が OpenSpec の proposal / specs / tasks を書き、それに沿ってコード生成・型チェック・テスト・E2Eまで回し、Cloudflareプレビューで本人が確認してから main へ。デザイン自体も汎用Webではなく SwiftUIネイティブアプリ風に寄せる（§4）

## 1. リポジトリ構成（Turborepo）
```
swiftui-canvas/
  apps/
    web/            # キャンバス本体（静的SPA、Next.js static export か Vite かは §6 の判断事項）
  packages/
    core/           # ドキュメントモデル + 検証 + 共有リンク符号化（UI非依存、テスト対象）
    prompt/         # プロンプト生成（core に依存、テスト対象）
    glass/          # Liquid Glass 素材（CSS/SVGフィルタ + Reactコンポーネント）
  turbo.json
  package.json      # pnpm workspace
```
- core / prompt / glass を分ける理由: 将来の CLI / MCP サーバが core+prompt をそのまま再利用できる。MCPはMVP外だが、境界だけ先に作る（移行コストゼロの時点で切る）

## 2. ドキュメントモデル（packages/core）
既存実装の教訓を取り入れた最小モデル。JSON そのものが保存形式・共有形式・プロンプト入力を兼ねる。

```ts
Doc   = { version: 1, title, lang: 'en'|'ja'|'zh', theme, screens: Screen[], parts: Part[] }
Screen= { id, name, x, y, note?, bg?: 'system'|'secondary'|'grouped'|hex, chrome: boolean }
        // 393×852pt 固定（iPhone論理サイズ）。chrome = ステータスバー+ホームインジケータ描画
Part  = { id, screen: string|null, kind, x, y, w?, h?,
          label, icon? /* SF Symbol名 */, supporting?, variant,
          options?: { label, icon?, target? }[],
          checked?, selected?, value?,
          note? /* 振る舞いメモ → プロンプトに入る */,
          link?: { target: screenId|'back', transition: 'push'|'zoom'|'sheet'|'cover'|'none' },
          presents?: string /* 同一画面の alert/sheet の part id */ }
Theme = { accent /* preset key | hex */, scheme: 'light'|'dark',
          shape: 'default'|'capsule', font: 'system'|'rounded'|'serif'|'monospaced' }
```
- 検証は「厳密（保存時）」と「寛容（共有リンク/読込時：壊れた部品は落として警告）」の2段構えにする（既存実装の良い設計）
- IDは短いランダム文字列。座標はpt単位、グリッド8pt

## 3. 部品セット（MVP: 20種に絞る）
既存実装は32種あるが、ゼロから版のMVPは「よく使う20種」に絞り、残りは v1.1 で足す。

| 分類 | 部品 |
|---|---|
| バー | Navigation Bar（large/inline）, Tab Bar（**ガラス・浮遊カプセル**）, Search Field |
| アクション | Button（plain/bordered/borderedProminent/**glass/glassProminent**）, Icon Button, Menu, Link |
| 入力 | Text Field, Secure Field, Toggle, Slider, Stepper, Segmented, Picker |
| 表示 | Text（largeTitle〜caption）, Image, List（insetGrouped/plain）, Card, Divider, Progress |
| モーダル | Alert, Sheet |
| プレースホルダ | Box（背景コンテナ）, Content Unavailable（空状態） |

後回し（v1.1）: Gauge, Chart, Map, DatePicker, TextEditor, ShareLink, Disclosure, LabeledContent

## 4. Liquid Glass 基盤（packages/glass）— このプロジェクトの心臓
ブラウザで本物の glassEffect は出せない前提で、知覚的に最も近い階層を組む。

### 素材のレシピ（3層）
1. **屈折層 (Chromiumのみ)**: SVG `feDisplacementMap` を `backdrop-filter: url(...)` で適用し、縁の数pxだけ背景を歪める。半径・強さはカプセル形状に追随。Safari/Firefox は url() 非対応 → 自動で次層のみに劣化（「対応ブラウザで屈折、それ以外はフロスト」と正直に明記）
2. **フロスト層 (全ブラウザ)**: `backdrop-filter: blur(20px) saturate(180%) brightness(1.06)` + 半透明ティント
3. **質感層**: 上縁のスペキュラハイライト（linear-gradient の1pxライン＋内側シャドウ）、外側の柔らかいドロップシャドウ、0.5px の明るい境界

### 適用先
- **Tab Bar**: 画面下端ベタ付けを廃止。左右16pt・下8pt浮いたカプセル（高さ約62pt、完全なCapsule形状）。選択中タブは一段明るいガラスのピルでハイライト。ホームインジケータはバーの外（画面側）に描く
- **Navigation Bar / Toolbar**: 全面バーをやめ、タイトルはテキストのみ浮かせ、戻る/アクションはガラスの円形・カプセルボタン群にする（iOS 26の実挙動）。Large Title は従来位置に残す
- **Button (.glass / .glassProminent)**: 上記レシピそのまま。Prominent はアクセント色ティントを強める
- **Sheet / Alert**: 背景にガラス寄りの素材＋強いシャドウ
- **Glass Container の近似**: 近接したガラス要素同士は背景のぼかしを共有して見えるよう、コンテナ側で一括 backdrop を敷く近似（本物のモーフィングは再現しない、と割り切る）

### ツール自体のUI
エディタのツールバー、部品パレット、インスペクタ、プロンプトパネルも同じ glass パッケージで作る。キャンバス背景にはガラスが映えるグラデーション/写真系の背景を選べるようにする（デフォルトは写真風グラデーション）。
さらにデザイン言語全体を「Webダッシュボード」ではなく **SwiftUIネイティブアプリそのもの** に寄せる（本人の指示 2026-11-20）: システムカラー/タイポグラフィ（SF系フォントスタック）、iOS式ツールバーとセグメンテッドコントロール、Xcode/SwiftUIプレビュー風のインスペクタ、SF Symbols 名で統一したアイコン（Web側の実描画はライセンス上 Lucide の形近代替を使う）。汎用的な管理画面風UI（shadcn等のデフォルト見た目）は使わない。

## 5. キャンバス / エディタ仕様
- 無限キャンバス: パン（Space/手ツール）、ズーム（ホイール/Ctrl+ホイール）、フィット（0）
- 画面の追加/複製/削除/リネーム、画面ごとドラッグ移動
- 部品: パレットからドラッグ＆ドロップ、選択・移動・リサイズ（バー類は固定サイズ）、スナップ（8ptグリッド＋他部品/画面端ガイド）
- Undo/Redo（履歴スタック）、複製（Ctrl+D）、微調整（矢印キー、Shift=10pt）、削除
- Tidy（バーを端へ、残りを16ptマージンで整列）と Align（単体=本文領域、複数=相互整列/等間隔）— MVPでは Tidy のみ、Align は v1.1
- レイヤーパネル（z順の表示と入替）— v1.1 に回し、MVPは描画順=追加順
- 遷移の可視化: link を持つ部品から対象画面へ矢印を描く
- プレビュー: 実機枠でタップ遷移（push/zoom/sheet/cover）、タブ切替、Alert/Sheet表示。Pキーで開閉

## 6. 判断事項（実装前に決める1点）
フレームワーク: **Next.js 静的エクスポート** vs **Vite + React SPA**
- 推奨は **Vite + React SPA**。理由: バックエンドなし・全機能クライアント完結なので Next の SSR/ルーティングは不要で、ビルドが速く、Cloudflare Pages への静的配置も単純。既存2実装が Next なのは静的書き出し目的のみ
- Next に寄せる理由があるとすれば将来のランディング/ドキュメントの SSG くらい（その場合も apps/web の中身はSPA同等になる）

## 7. プロンプト生成（packages/prompt）
- 出力言語: **en / ja / zh**（日本語を最初から入れるのが既存実装との差。M3Eが日本でバズった経緯）
- 固定するAPI基線（既存実装の設計を踏襲しつつ自前で書く）:
  - deployment target iOS 26.0 / Swift 6.2、NavigationStack、TabView + Tab（NavigationView禁止）、.searchable
  - 状態は @Observable、色は foregroundStyle、アイコンは SF Symbols 名を原文のまま Image(systemName:)
  - Liquid Glass: ツールバーは自動でガラス、カスタムは .glassEffect() / GlassEffectContainer / buttonStyle(.glass/.glassProminent)、.scrollEdgeEffectStyle、zoom遷移は .navigationTransition(.zoom)
  - 文案はプロンプトの文字列を原文のまま使う（翻訳しない）、アイコンのみのボタンには VoiceOver ラベル
- 構成: 概要 → テーマ（アクセント色は RGB 数値で）→ 画面ごと（部品を視覚順に、位置関係を言葉で）→ 遷移と振る舞い（note を含む）→ API基線
- 全体プロンプトと画面単位プロンプトの両方をコピー可能に

## 8. 保存 / 共有
- 自動保存: localStorage（Doc JSON そのまま）
- ファイル: JSON の保存/読込（ファイル名はタイトルから生成）
- 共有リンク: JSON → deflate-raw 圧縮 → base64url → URLハッシュ（`#sc=` プレフィクス自前定義）。サーバなし
- PNG書き出し: v1.1（M3EにあるがMVP外）

## 9. 進め方（フェーズ）
1. **Phase 0 — ガラスの実験**（最重要・最初）: glass パッケージ単体で、浮遊タブバー＋ガラスボタンを写真背景の上で再現し、Chromium/Safari の見え方を確認。ここの出来で全体が決まるので、キャンバスより先にやる
2. **Phase 1 — 土台**: Turborepo 初期化、core モデル＋検証＋共有リンク、テスト
3. **Phase 2 — エディタ**: キャンバス、パレット、インスペクタ、画面/部品操作、Undo、Tidy
4. **Phase 3 — プレビュー＋プロンプト**: タップ遷移プレビュー、prompt パッケージ（3言語）、コピーUI
5. **Phase 4 — 仕上げ**: ツールUI自体のガラス化統一、ランディング的な初期画面、Cloudflare Pages プレビュー → 本人確認 → 本番

工数感（見積もり）: Phase 0 が 2〜3日、全体で 3〜5週間規模（フォーク案より重いのは織り込み済みの選択）

## 10. 未決事項
- §6 フレームワーク（Vite推奨で進めてよいか）
- ドメイン（独自ドメインを取るか、まずは *.pages.dev で出すか）
- ライセンス（MITで公開するか、最初は非公開リポジトリで作るか）
