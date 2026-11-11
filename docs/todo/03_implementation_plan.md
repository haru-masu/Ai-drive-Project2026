# TODOアプリ V1 実装手順書

## 1. 開発目的

既存のExpress・TypeScript・EJS・Neon PostgreSQL環境にTODOアプリを追加する。

`01_requirements.md` のREQ-01〜REQ-04と `02_design.md` に従い、データベースのCRUDとFetch APIによる画面操作を実装する。

既存の `/`、`/api/db-check`、`/db-sample` は維持する。

## 2. 開発環境

| 項目 | 内容 |
|---|---|
| 作業ブランチ | `feature/todo-v1` |
| バックエンド | Node.js・Express・TypeScript |
| フロントエンド | EJS・JavaScript・Fetch API |
| データベース | Neon PostgreSQL |
| デプロイ先 | Vercel |

作業開始時の確認コマンド：

```powershell
git branch --show-current
git status
npm run build
```

期待結果：作業ブランチが `feature/todo-v1` であり、ビルドが成功すること。

## 3. 実装手順

### 工程1：SQLファイルの作成とGitへの保存

対象：`sql/todo/020_create_todo_tasks.sql`

作業：
- `todo_tasks` テーブルを定義する
- 主キー、自動採番、タイトル制約、完了状態、作成日時を設定する
- タイトルを前後の空白除去後1〜100文字に制限する
- SQLをGitの管理対象に追加する

確認コマンド：

```powershell
git status
git diff --no-index -- /dev/null sql/todo/020_create_todo_tasks.sql
```

期待結果：SQLファイルが存在し、テーブル定義を確認できること。

失敗時：ファイルの保存場所、SQL構文、制約条件を確認する。

### 工程2：Neon SQL Editorでの手動実行

対象：Neon `neondb` の `todo_tasks`

作業：
- Neon SQL EditorでSQLを実行する
- テーブルとカラムを確認する
- 既存の `products` テーブルは変更しない

確認SQL：

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'todo_tasks'
ORDER BY ordinal_position;
```

期待結果：`id`、`title`、`is_completed`、`created_at` が確認できること。

失敗時：Neonの接続先ブランチ、データベース名、SQL実行結果を確認する。

### 工程3：REQ-01 TODO一覧取得

対象：
- `todoModel.ts`
- `todoController.ts`
- `todoRouter.ts`

作業：
- GET `/api/v1/todos` を実装する
- DBからTODO一覧を取得する
- 0件の場合はHTTP 200で `{"data":[]}` を返す
- DB列をcamelCaseのJSONキーに変換する

確認コマンド：

```powershell
Invoke-RestMethod http://localhost:3000/api/v1/todos
```

期待結果：TODO一覧または `data` が空配列のJSONが返ること。

失敗時：Router登録、Controller、SQL、DB接続を確認する。

### 工程4：REQ-02 TODO新規登録

対象：
- `todoModel.ts`
- `todoController.ts`
- `todoRouter.ts`

作業：
- POST `/api/v1/todos` を実装する
- タイトルの前後の空白を除去する
- 1〜100文字の入力チェックを行う
- 正常時はHTTP 201を返す

確認コマンド：

```powershell
Invoke-RestMethod `
  -Uri http://localhost:3000/api/v1/todos `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"title":"テストTODO"}'
```

期待結果：TODOが登録され、IDと登録内容が返ること。

失敗時：JSON解析設定、入力制約、INSERT処理を確認する。

### 工程5：REQ-03 完了状態の部分更新

対象：
- `todoModel.ts`
- `todoController.ts`
- `todoRouter.ts`

作業：
- PATCH `/api/v1/todos/:id` を実装する
- IDは1以上の整数とする
- `isCompleted` をboolean型として検証する
- 指定TODOの完了状態だけを変更する

確認コマンド例：

```powershell
Invoke-RestMethod `
  -Uri http://localhost:3000/api/v1/todos/1 `
  -Method Patch `
  -ContentType "application/json" `
  -Body '{"isCompleted":true}'
```

期待結果：指定したTODOの完了状態が変更されること。

失敗時：対象ID、入力JSON、UPDATE処理を確認する。

※例のID `1` は、実際に登録されたTODOのIDに置き換える。

### 工程6：REQ-04 TODO削除

対象：
- `todoModel.ts`
- `todoController.ts`
- `todoRouter.ts`

作業：
- DELETE `/api/v1/todos/:id` を実装する
- 指定TODOを削除する
- 成功時はHTTP 204で本文を返さない

確認コマンド例：

```powershell
Invoke-WebRequest `
  -Uri http://localhost:3000/api/v1/todos/1 `
  -Method Delete
```

期待結果：HTTP 204となり、対象TODOが一覧から消えること。

失敗時：ID、DELETE処理、対象レコードの有無を確認する。

※実際に登録したテスト用TODOのみ削除する。

### 工程7：TodoApiクラスの実装

対象：`public/todo/todo.js`

作業：
- Fetch通信をTodoApiクラスに集約する
- `getTodos()`
- `createTodo(title)`
- `updateTodo(id, isCompleted)`
- `deleteTodo(id)`

期待結果：4つのAPI操作をTodoApiのメソッドから呼び出せること。

失敗時：FetchのURL、HTTPメソッド、リクエスト本文、レスポンス処理を確認する。

### 工程8：TODO画面の実装

対象：
- `views/todo/index.ejs`
- `public/todo/todo.js`
- `index.ts`

作業：
- `/todo` に画面を配置する
- TODOの登録、一覧、完了切替、削除を表示する
- 0件時は「TODOがありません」と表示する
- ページを再読み込みせずに一覧を更新する
- `index.ts` にtodoRouterを登録する

確認URL：`http://localhost:3000/todo`

期待結果：画面からCRUD操作が正常に行えること。

失敗時：EJSファイル、JavaScriptの読み込み、ブラウザの開発者ツールを確認する。

### 工程9：ローカル環境テスト

確認コマンド：

```powershell
npm run build
npm run dev
```

確認項目：
- REQ-01〜REQ-04の正常動作
- 0件時の表示
- 空白のみのタイトル
- 101文字以上のタイトル
- 不正ID
- 存在しないTODO
- 登録内容の永続化

結果は `docs/todo/04_test_results.md` に記録する。

### 工程10：Vercel Previewテスト

作業：
- 作業ブランチをGitHubにpushする
- Vercel Previewのデプロイを確認する
- PreviewでCRUDとエラー処理を確認する

期待結果：Preview環境で正常動作すること。

失敗時：Vercelのデプロイログと環境変数を確認する。

### 工程11：Pull Request作成

作業：
- `feature/todo-v1` から `main` へPull Requestを作成する
- 変更ファイルとテスト結果を確認する
- チェック成功後にマージする

確認項目：
- `.env` が含まれていない
- 既存機能が変更されていない
- Vercel Previewが正常
- REQ-01〜REQ-04のテスト結果が記録されている

期待結果：安全にmainへマージできること。

### 工程12：Vercel Productionテスト

作業：
- 本番環境へのデプロイを確認する
- `/`、`/api/db-check`、`/db-sample`、`/todo` を確認する
- TODOのCRUDとエラー処理をテストする
- 結果を `04_test_results.md` に記録する

期待結果：既存機能とTODO機能の両方が正常に動作すること。

## 4. 注意事項

- SQLをGitに保存する工程と、Neonで手動実行する工程を分ける
- DB接続情報やパスワードはGitに登録しない
- JSONはcamelCase、DB列はsnake_caseとする
- PreviewとProductionでは同じNeon DBを使用する
- 個人情報を含まない架空のテストデータを使う
- V1では認証、優先度、絞り込み、タイトル変更は実装しない

## 5. 完成条件

- REQ-01〜REQ-04が要件どおり動作する
- TodoApiクラスとFetchによる画面操作が動作する
- ローカル・Preview・Productionでテストが完了する
- 文書4件とSQLファイルが保存されている
- Pull Requestによるmainへの反映が完了している

## 6. 現在の進捗

既にローカル環境で基本CRUDの動作は確認済み。

最新仕様との差分であるタイトル100文字制約、JSON形式、TodoApiクラス、0件時表示、エラー処理については追加修正が必要。