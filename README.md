# 🎯 就活管理アプリ

> フレームワークなしのバニラ JavaScript で構築した、就活の全工程を一元管理する SPA（シングルページアプリケーション）

[![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/ja/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/ja/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/ja/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 📌 概要

就職活動では「どの企業のどの選考にいるか」「次の面接はいつか」「ESは何を書いたか」など、膨大な情報を同時に管理する必要があります。このアプリはそれらをブラウザ完結・インストール不要で一元管理できるツールです。

React・Vue などのフレームワークは使わず、**バニラ HTML / CSS / JavaScript のみ**で SPA を設計・実装しました。ルーティング・状態管理・コンポーネント分割もすべてゼロから構築しています。

### 🔗 デモ・リポジトリ

| | リンク |
|---|---|
| **GitHub** | [https://github.com/Kosuke1029/job-hunting-manager](https://github.com/Kosuke1029/job-hunting-manager) |
| **ローカル起動** | `index.html` をブラウザで開くだけで動作します（サーバー不要） |

---

## ✨ 主な機能

### 🏠 ダッシュボード
- 登録企業数・選考中・内定/通過・お祈りの **KPI サマリーカード**
- **直近 14 日のスケジュール**を一覧表示（日付昇順/降順ソート切替）
- 残り日数に応じて色分け（3 日以内: 赤・7 日以内: 黄）
- 進行中企業の**選考ステージ分布バー**（グラフィカルに可視化）
- 最近更新した企業の一覧（上位 6 社）

### 🏢 企業管理
- 企業名・タイプ（本選考 / インターン）・業界・Tier・応募方法などを登録
- **複数フィルター**（タイプ・Tier・業界・選考ステージ）と企業名検索
- 列ヘッダークリックによる**ソート**（企業名・Tier・直近日程）
- 企業詳細モーダルに **4 つのタブ**（基本情報 / 選考フロー / ES / 備考）

#### 選考フロー管理（ステップ管理）
- 各企業に複数の**選考ステップを自由に追加**（ES提出・WEBテスト・GD・面接など）
- 各ステップに「日程・結果（未定/進行中/通過/お祈り/辞退）」を記録
- **現在の選考状況を自動判定**：ステップデータから「今どのステップにいるか」を計算して表示
- **直近日程も自動取得**：ステップの最も近い未完了日程を企業一覧に反映

### 📄 ES 管理
- 企業・カテゴリ（自己PR/ガクチカ/志望動機/その他）でのフィルタリング
- 企業名・更新日の**ソート機能**
- 同一企業の複数設問を**前後ナビゲーション**で連続編集
- 文字数カウント・品質タグ（自信あり / 普通 / 要改善 / AI生成）

### 📅 カレンダー
- 月間カレンダー形式でスケジュールをビジュアル表示
- 各日付のセルにイベントチップ（複数対応）
- タイプ（本選考 / インターン）でのフィルタリング
- アジェンダリスト（月内のイベントを日付順に一覧）

### 📊 選考分析
- **KPI カード 7 種**：登録企業数・選考中・内定/通過・お祈り・最終通過率・ES 登録数・最難関ステップ
- **Chart.js による 5 種のチャート**
  - 選考ステップ別 通過 / お祈り（横棒グラフ）
  - Tier 別 応募・結果（積み上げ棒グラフ）
  - 業界別 応募・通過（横棒グラフ）
  - インターン vs 本選考（ドーナツグラフ）
  - 月別 応募数推移（折れ線グラフ）
- **ステップ別通過率テーブル**：通過率をビジュアルバーで表示、色分けで合否傾向を把握

### 📝 メモ・TODO
- **TODO リスト**：優先度（高/中/低）・期日・関連企業を設定、完了チェックで管理
- **面接メモ**：企業ごとの面接記録（日付・形式・内容・感触）
- **OB/OG 訪問記録**：訪問者情報・日時・相談内容・メモ

### ⚙️ 設定
- 全データを **JSON ファイルとしてエクスポート**（バックアップ・共有）
- JSON ファイルから**インポート**（別のPCへの移行対応）
- 全データのリセット

---

## 🛠 技術スタック

| カテゴリ | 技術 |
|---|---|
| **フロントエンド** | HTML5 / CSS3 / JavaScript (ES6+) |
| **ルーティング** | ハッシュベース SPA（`location.hash`）|
| **データ永続化** | Web Storage API（`localStorage`）|
| **グラフ描画** | [Chart.js v4](https://www.chartjs.org/)（CDN） |
| **ビルドツール** | なし（バンドラー不使用） |
| **外部依存** | Chart.js のみ（CDN 接続が必要） |

> **ポイント**：React・Vue・jQuery などのライブラリを一切使わず、Web 標準 API のみで SPA を実現しています。

---

## 📁 ファイル構成

```
job-hunting-manager/
├── index.html                  # エントリーポイント・モーダル/トースト DOM
├── css/
│   └── style.css               # 全スタイル（CSS 変数・レスポンシブ対応）
└── js/
    ├── data.js                 # DB 層（localStorage CRUD・定数定義）
    ├── utils.js                # 共通ユーティリティ（バッジ描画・日付・選考状況自動判定）
    ├── app.js                  # SPA コア（ルーティング・ページ切替・サイドバー）
    ├── components/
    │   ├── modal.js            # モーダルコンポーネント（confirm / form 対応）
    │   └── toast.js            # トースト通知コンポーネント
    └── pages/
        ├── dashboard.js        # ダッシュボード
        ├── companies.js        # 企業管理（フィルター・選考フロー・詳細）
        ├── es.js               # ES 管理（フィルター・ソート・前後ナビ）
        ├── calendar.js         # カレンダー（月間グリッド・アジェンダ）
        ├── analysis.js         # 選考分析（KPI・Chart.js グラフ・通過率テーブル）
        ├── memo.js             # TODO・面接メモ・OB/OG 訪問
        └── settings.js         # データ管理（エクスポート・インポート・リセット）
```

---

## 🚀 使い方

### インストール不要で即起動

```bash
# リポジトリをクローン
git clone https://github.com/Kosuke1029/job-hunting-manager.git

# index.html をブラウザで開く（ダブルクリックでOK）
```

サーバーや `npm install` は不要です。`index.html` をブラウザで開くだけで動作します。

### 基本的な流れ

```
1. 「企業管理」→「＋企業追加」で企業を登録
         ↓
2. 企業詳細の「選考フロー」タブで選考ステップを追加（日程・結果を記録）
         ↓
3. ダッシュボードで直近スケジュールと選考状況を確認
         ↓
4. 「選考分析」で通過率・傾向を把握して戦略を調整
```

---

## 💾 データ管理

全データはブラウザの `localStorage` に保存されます。

| データ種別 | localStorage キー |
|---|---|
| 企業情報 | `skt_companies` |
| ES | `skt_es` |
| 面接メモ | `skt_interviews` |
| OB/OG 訪問 | `skt_obog` |
| 選考ステップ | `skt_steps` |
| TODO | `skt_todos` |

### バックアップ・移行

1. 設定ページの **「JSON をダウンロード」** で全データをエクスポート
2. 別の PC の同アプリに **「JSON ファイルを選択」** でインポート

---

## 🔍 実装上の工夫

### 選考状況の自動判定 (`getComputedStatus`)

選考ステップのデータ（順序・結果）を解析し、「現在どの選考にいるか」と「直近の日程」をリアルタイムで導出します。手動入力なしで企業一覧・ダッシュボードに反映されます。

```javascript
// utils.js より
function getComputedStatus(company) {
  // 手動の最終結果が設定されていれば優先
  if (company.finalResult) { ... }

  // ステップを順番に走査して現在地を判定
  for (const s of steps) {
    if (s.result === 'お祈り') return { finalResult: 'お祈り', ... };
    if (s.result === '進行中' || s.result === '未定') {
      return { currentStage: s.name, nextDate: s.date, ... };
    }
  }
}
```

### フレームワークなし SPA の設計

- **ルーティング**：`location.hash` の変化を `hashchange` イベントで検知、ページオブジェクトの `render()` を呼び出してDOMを書き換え
- **状態管理**：各ページをオブジェクトリテラルで定義し、`_filter` / `_sort` などのプロパティで状態を保持
- **コンポーネント**：Modal・Toast を再利用可能な独立オブジェクトとして実装

### XSS 対策

ユーザー入力はすべて `esc()` 関数で HTML エスケープしてからテンプレートリテラルに挿入しています。

```javascript
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
                        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

---

## 📄 ライセンス

[MIT License](LICENSE)

---

<div align="center">

**就活の全工程を、ブラウザ完結で管理する**

Made with ❤️ by [Kosuke1029](https://github.com/Kosuke1029)

</div>
