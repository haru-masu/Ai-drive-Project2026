# TODOアプリ V1 設計書

## 1. 作るものとファイルの役割

既存のExpress・TypeScript・EJSアプリにTODO管理機能を追加する。

| ファイル | 役割 |
|---|---|
| `index.ts` | TODO画面とAPIルーターの登録 |
| `src/apps/todo/todoRouter.ts` | URLとHTTPメソッドの対応 |
| `src/apps/todo/todoController.ts` | 入力検証・レスポンス・エラー処理 |
| `src/apps/todo/todoModel.ts` | DB操作 |
| `views/todo/index.ejs` | TODO画面 |
| `public/todo/todo.js` | Fetch通信とTodoApiクラス |
| `sql/todo/020_create_todo_tasks.sql` | テーブル作成SQL |

既存の `/`、`/api/db-check`、`/db-sample` は維持する。

## 2. リクエストの処理経路

画面 `/todo` からFetch APIでリクエストを送信する。

画面 → TodoApi → Router → Controller → Model → Neon PostgreSQL

`index.ts` に以下を登録する。

```typescript
import todoRouter from "./src/apps/todo/todoRouter";
app.use("/api/v1/todos", todoRouter);
```

画面ルートは `/todo` とする。

## 3. データベース設計

テーブル名：`todo_tasks`

| カラム | 型 | 制約 |
|---|---|---|
| id | INTEGER | 主キー・自動採番 |
| title | TEXT | NOT NULL・1〜100文字 |
| is_completed | BOOLEAN | NOT NULL・初期値FALSE |
| created_at | TIMESTAMPTZ | NOT NULL・初期値NOW() |

タイトルは前後の空白を除去して登録する。

DBのカラム名はsnake_caseとし、APIのJSONキーはcamelCaseとする。

| DB列 | JSONキー |
|---|---|
| id | id |
| title | title |
| is_completed | isCompleted |
| created_at | createdAt |

既存のテーブルは最大200文字の制約で作成済みのため、最大100文字へ変更するSQLが必要となる。

## 4. APIの共通ルール

APIの基本URL：`/api/v1/todos`

- GET：一覧取得
- POST：新規登録
- PATCH：完了状態の部分更新
- DELETE：削除
- ID：1以上の整数
- タイトル：前後の空白を除去して1〜100文字
- 正常時・異常時とも適切なHTTPステータスを返す
- DELETE成功時は204で本文を返さない

成功・エラーの厳密なJSON形式は「第6章 V1共通仕様」と照合して確定する。

以下のJSON例は、現在判明している教材条件に基づく設計案である。

## 5. API詳細設計

### 5.1 REQ-01：TODO一覧取得

| 項目 | 内容 |
|---|---|
| メソッド | GET |
| URL | `/api/v1/todos` |
| リクエスト本文 | なし |
| 成功ステータス | 200 |
| DB処理 | SELECT |
| Model | `getTodos()` |
| Controller | `listTodos()` |
| TodoApi | `getTodos()` |
| 確認方法 | 0件・複数件でGETし画面とレスポンスを確認 |

成功JSON例：

```json
{
  "data": [
    {
      "id": 1,
      "title": "課題を提出する",
      "isCompleted": false,
      "createdAt": "2026-10-28T06:00:00.000Z"
    }
  ]
}
```

0件の場合：

```json
{"data":[]}
```

エラー：DB接続不可503、サーバー内部エラー500。

### 5.2 REQ-02：TODO新規登録

| 項目 | 内容 |
|---|---|
| メソッド | POST |
| URL | `/api/v1/todos` |
| リクエスト本文 | `{"title":"課題を提出する"}` |
| 成功ステータス | 201 |
| DB処理 | INSERT |
| Model | `createTodo()` |
| Controller | `addTodo()` |
| TodoApi | `createTodo()` |
| 確認方法 | 正常登録、空白、101文字で検証 |

成功JSON例：

```json
{
  "data": {
    "id": 1,
    "title": "課題を提出する",
    "isCompleted": false,
    "createdAt": "2026-10-28T06:00:00.000Z"
  }
}
```

エラー：リクエスト形式不正400、入力条件違反422、サーバー内部エラー500、DB利用不可503。

### 5.3 REQ-03：完了状態の部分更新

| 項目 | 内容 |
|---|---|
| メソッド | PATCH |
| URL | `/api/v1/todos/:id` |
| リクエスト本文 | `{"isCompleted":true}` |
| 成功ステータス | 200 |
| DB処理 | UPDATE |
| Model | `updateTodo()` |
| Controller | `changeTodo()` |
| TodoApi | `updateTodo()` |
| 確認方法 | 完了・未完了への変更と永続化を確認 |

成功JSON例：

```json
{
  "data": {
    "id": 1,
    "title": "課題を提出する",
    "isCompleted": true,
    "createdAt": "2026-10-28T06:00:00.000Z"
  }
}
```

エラー：形式不正400、値の条件違反422、対象なし404、サーバー内部エラー500、DB利用不可503。

### 5.4 REQ-04：TODO削除

| 項目 | 内容 |
|---|---|
| メソッド | DELETE |
| URL | `/api/v1/todos/:id` |
| リクエスト本文 | なし |
| 成功ステータス | 204 |
| 成功レスポンス | 本文なし |
| DB処理 | DELETE |
| Model | `deleteTodo()` |
| Controller | `removeTodo()` |
| TodoApi | `deleteTodo()` |
| 確認方法 | 削除前後のGETで対象が消えていることを確認 |

エラー：ID形式不正400、対象なし404、サーバー内部エラー500、DB利用不可503。

## 6. 画面・TodoApiクラスの設計

画面URL：`/todo`

画面には以下を配置する。

- タイトル入力欄と登録ボタン
- TODO一覧
- 完了状態のチェックボックス
- 削除ボタン
- 0件時の「TODOがありません」
- エラー表示欄

`public/todo/todo.js` にTodoApiクラスを作成し、通信処理を集約する。

| TodoApiメソッド | HTTP処理 |
|---|---|
| `getTodos()` | GET |
| `createTodo(title)` | POST |
| `updateTodo(id, isCompleted)` | PATCH |
| `deleteTodo(id)` | DELETE |

画面はTodoApiのメソッドを呼び出し、Fetchで結果を取得する。

## 7. エラー処理

- Router：HTTPメソッドとURLの振り分け
- Controller：入力検証・HTTPステータス・エラーJSON
- Model：DBへの問い合わせ
- TodoApi：Fetchの結果確認・エラー通知
- 画面：エラーメッセージ表示

| HTTP | 内容 |
|---|---|
| 400 | リクエスト形式・ID不正 |
| 422 | タイトルや完了状態の入力条件違反 |
| 404 | 対象TODOなし |
| 500 | サーバー内部エラー |
| 503 | DBなどのサービス利用不可 |

## 8. 実装への注意事項

- 既存のトップページ・商品一覧・DB接続確認APIを維持する
- `index.ts` への追記を最小限にする
- SQLではプレースホルダーを使用する
- APIとDBの命名規則を区別する
- Fetchで画面全体を再読み込みせず更新する
- PreviewとProductionが同じNeon DBを参照する点に注意する
- テストには個人情報を使用しない

## 9. 確認事項

- 第6章 V1共通仕様における成功・エラーJSONの正確な形式
- 現在のTODOテーブルの最大200文字制約を100文字へ変更する手順
- TodoApiクラスへの変更後のフロントエンド動作確認