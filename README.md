# SwiftUI Canvas

**開発版 / Development Preview**

MuseにiOSアプリのUI参考画像を作ってもらうために、画面の構成や部品を具体的に伝えられるようにしたい。そんな開発者自身の用途から作った、ブラウザで使えるUI構成ツールです。

SwiftUI風の部品を並べ、画面をつなぎ、プレビューで操作を確かめられます。組み立てた画面を参考画像として共有したり、画面構成を説明するプロンプトをコピーしてAIコーディングツールに渡したりできます。

現在は開発中のMVPです。操作・見た目・保存形式は今後変わる可能性があります。残しておきたい設計は、プロジェクトメニューからJSONファイルとして保存してください。

## Museと使う

1. **構成を作る** — 画面を追加し、ナビゲーションバー、タブバー、テキスト、ボタンなどを配置します。
2. **意図を補う** — ラベル、色、画像、遷移先、画面や部品のメモを設定します。
3. **動きを確かめる** — プレビューでタブ切り替え、入力、画面遷移を試します。
4. **参考画像を渡す** — ブラウザやOSのスクリーンショット機能で画面を撮り、Museに添付します。
5. **画像制作を依頼する** — 保ちたい構成と、変えたい雰囲気を文章で伝えます。実装へ進む際は、このツールの「プロンプト」も利用できます。

たとえば、Museには次のように依頼できます。

> 添付は、作りたいiOSアプリの画面構成です。この部品構成と情報の優先順位を保ちながら、余白・配色・文字組みを整えたUI参考画像を作ってください。下部にはホーム・検索・設定のタブを置き、検索時は下部に検索欄が開く想定です。

画像生成はMuse側で行います。SwiftUI Canvas自体には、画像生成APIへの接続や専用のPNG書き出し機能はありません。「プロンプト」が出力するのは、SwiftUI実装向けの構成・動作の説明です。

## できること

- **画面編集**：画面と部品の追加・移動・サイズ変更・複製・削除、整列、Undo / Redo。
- **27種類の部品**：ナビゲーションバー、タブバー、ボタン、入力欄、リスト、カード、Gauge、DatePicker、ColorPickerなど。
- **プレビュー**：画面遷移、アラート／シート、入力、ピッカー、スライダーなどを操作。プレビュー中の変更は設計データに保存されません。
- **検索タブ**：下部の検索タブから検索欄を開き、表示先の画面内のテキストやリストなどを検索。キャンセルで元の画面・選択状態に戻ります。
- **画像の取り込み**：PNG / JPEG / WebP / GIFをインスペクタから追加。10 MBまで、最大辺1200 pxに縮小してプロジェクトに埋め込みます。アニメーション画像は静止画として取り込みます。
- **コンテナ**：部品の所属コンテナを指定し、まとめて移動・複製。一段のグループで、座標は画面基準です。
- **外観**：アクセント色、ライト／ダーク、角の形、フォントを設定。
- **プロンプト出力**：アプリ全体または選択画面のSwiftUI実装用プロンプトを、日本語・英語・中国語でコピー。
- **保存・共有**：ブラウザ内への自動保存、JSONファイルの保存／読み込み、設計データを含む共有リンク。

PCでは左側に画面・レイヤーと部品ライブラリ、中央にキャンバス、右側にインスペクタを表示します。スマホ幅では「ナビゲータ」「インスペクタ」から必要なパネルを開けます。ファイル操作と言語設定は、アプリ名横のプロジェクトメニューにあります。

## UIは何でできている？

エディタとiPhone画面の部品は、主にReactとCSSで自作しています。XcodeやAppleのアプリの構成を参考にしていますが、ブラウザ内でSwiftUIを実行しているわけではありません。

| 部分 | 実装 |
|---|---|
| ツールバー・ナビゲータ・インスペクタ | 自作のReactコンポーネントとCSS |
| iPhone画面内の部品 | 自作のSwiftUI風レンダラー |
| Liquid Glass表現 | `packages/glass`：CSSのぼかしとSVGフィルタ |
| テキスト・日付・色などの入力 | ブラウザ標準の入力部品をスタイリング |
| アイコン | SF Symbolsの名称・表現を参考にした自作SVG |
| ガラス比較ページ | 自作版と外部ライブラリ2種類を比較 |

外部ライブラリの`@zakisheriff/liquid-glass`と`@ozcanyldzhn/liquid-glass-js`は、`/compare`での比較用に使っています。メインエディタのUI部品は自作です。Appleの公式UIキットや、Appleによる公式ツールではありません。

SwiftUIの実際のレイアウト・挙動や端末ごとの表示は、実装後にXcodeや実機で確認してください。現段階のブラウザ動作確認はChromeを中心に行っており、Safari・実機iPhoneは未確認です。

## MCPについて

独自のMCPサーバーは現在ありません。

このツールでiOSらしい部品構成と動きを決め、Museにスクリーンショットと説明を渡して、UI参考画像の制作を依頼します。

MCPは、将来Museから直接「画面を追加する」「部品を配置する」「設計を読み取る」といった操作が必要になった段階で検討する位置づけです。

## 保存について

設計データは、このブラウザの`localStorage`に自動保存します。アカウントやクラウドへの同期機能はありません。ブラウザのデータ消去や端末の変更に備えるには、JSONファイルを保存しておきます。

共有リンクには、埋め込み画像を含む設計データが入ります。リンクを受け取った相手が設計を開ける仕組みです。画像が多くリンクが長くなる場合は、JSONファイルでの受け渡しを利用してください。

読み込めるJSONは20 MBまでです。共有リンクはペイロード100万文字まで、展開後のデータは20 MBまでに制限しています。

## ローカル開発

Node.js **22以上**と、`package.json`の`packageManager`に指定されたpnpm（現在 **12.14.0**）を使用します。

```bash
export DO_NOT_TRACK=1
export TURBO_TELEMETRY_DISABLED=1

pnpm install
pnpm dev
```

エディタは <http://127.0.0.1:5173> で開きます。

| パス | 内容 |
|---|---|
| `/` | エディタ |
| `/components` | 27部品のカタログ |
| `/glass-lab` | ガラス表現の実験 |
| `/compare` | ガラス実装3種類の比較 |

変更後の確認：

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

技術構成はReact、TypeScript、TanStack Start / Router、Viteです。pnpm workspaceとTurborepoで管理しています。

## リポジトリ構成

| パス | 内容 |
|---|---|
| `apps/web` | SPAモードのTanStack Startアプリ |
| `packages/core` | ドキュメントモデル、検証、保存、共有リンク |
| `packages/prompt` | 日本語・英語・中国語のプロンプト生成 |
| `packages/glass` | ガラス表現とコンポーネント |
| `openspec/` | 挙動の仕様 |
| [DESIGN.md](DESIGN.md) | 現在のMac風ワークスペースのデザイン方針 |
| [MVP-DESIGN.md](MVP-DESIGN.md) | 初期のMVP設計 |

## 公開（GitHub Pages）

開発版の公開先としてGitHub Pagesを想定しています。このリポジトリでは、公開後のURLは `https://kai-natori.github.io/swiftui-canvas/` になります。

まずリポジトリのルートでビルドします。

```bash
pnpm build:pages
```

`apps/web/dist/client/`が公開するディレクトリです。`/swiftui-canvas/`を前提にアセットとリンクを設定し、トップと各画面の`index.html`、`404.html`、`.nojekyll`を生成します。画面を直接開いたり、再読み込みしたりする場合もWorkerやリライトルールは不要です。

このコマンドはローカルでビルドするだけで、GitHubへは送信しません。独自ドメインなどでルートに配信する場合は、`pnpm build:pages /`でビルドできます。

GitHub Actionsは追加せず、`gh-pages`ブランチから手動で公開します。以下は、`gh-pages`ブランチをまだ作っていない場合の初回手順です。`git worktree add --orphan`に対応したGitと`rsync`を使用します。

```bash
# 初回だけ：公開用ブランチを別の作業ディレクトリに作成
git worktree add --orphan -b gh-pages ../swiftui-canvas-pages

# 公開用ディレクトリをビルド結果と同期する
rsync -a --delete --exclude='.git' apps/web/dist/client/ ../swiftui-canvas-pages/

# 内容を確認してから公開する
git -C ../swiftui-canvas-pages add --all
git -C ../swiftui-canvas-pages diff --cached --stat
git -C ../swiftui-canvas-pages commit -m "Publish development preview"
git -C ../swiftui-canvas-pages push origin gh-pages
```

GitHubのリポジトリ設定で **Settings → Pages → Source: Deploy from a branch → `gh-pages` / `(root)`** を選択します。上の`push`は公開操作です。公開対象はビルド結果だけで、ソースや`node_modules`は含めません。

更新時は同じ公開用worktreeを使い、再ビルド後に`rsync`以降を実行します。既に`gh-pages`ブランチがある別環境では、新規作成の代わりに`git fetch origin`と`git worktree add ../swiftui-canvas-pages gh-pages`でチェックアウトします。`rsync --delete`は公開用worktreeの古いアセットを削除するための指定です。

公開前には、少なくとも次を確認します。

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm audit --prod
pnpm build:pages
```

ブラウザでは、各画面の直接アクセス／再読み込み、部品カタログからの追加、共有リンク、スマホ幅のプレビューを確認します。依存関係の監査と入力サイズ制限は対策の一部であり、包括的なセキュリティ監査を実施済みという意味ではありません。

### Cloudflare Workersを使う場合

既存の`apps/web/wrangler.jsonc`も残しています。Worker名は`swiftui-canvas`で、ルートパス向けのSPAビルドをWorkers Static Assetsで配信します。Cloudflareの認証を用意した環境で、明示的に実行します。

```bash
unset APP_BASE_PATH
WRANGLER_SEND_METRICS=false pnpm --filter @swiftui-canvas/web run deploy
# ルートパスでビルドし直してから wrangler deploy
```

公開せずに構成を確認する場合は、ビルド後に`apps/web`で`wrangler deploy --dry-run`を実行します。

## 開発者

Kai Natori。MuseにiOSアプリのUI参考画像を作ってもらう際の、構成と意図の共有を出発点に開発しています。

Museによるコミットには、次のトレーラーを付けます。

```text
Co-authored-by: Kinako (Muse) <kinako@local>
```
