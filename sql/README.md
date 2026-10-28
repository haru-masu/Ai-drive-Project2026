# SQLファイルについて

000_check_connection.sql は、接続先を確かめるための読み取り専用SQLです。

NeonのSQL Editorで実行します。

## 商品テーブル

### 010_setup_sample_products.sql

productsテーブルを作成し、サンプル商品3件を登録するSQLです。

実行先：

- Neonプロジェクト：webapp-class
- ブランチ：production
- データベース：neondb

実行結果：

- ノート：200円
- ペン：120円
- 消しゴム：80円

その後、ノートの価格を250円に変更し、
ローカルの商品一覧ページに反映されることを確認しました。