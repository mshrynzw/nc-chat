# Supabase マイグレーション

このディレクトリには、Supabaseデータベースのマイグレーションファイルが含まれています。

## ローカルSupabaseの起動と停止

### Supabase CLIのインストール

```bash
# Supabase CLIをインストール
npm install -g supabase
```

### ローカルSupabaseの起動

```bash
# ローカルSupabaseインスタンスを起動
supabase start --workdir .
```

このコマンドを実行すると：

- ローカルのPostgreSQLデータベースが起動
- SupabaseのAPIサーバーが起動
- ローカルの環境変数情報が表示される

起動後、以下の情報が表示されます：

- `API URL`: ローカルのAPIエンドポイント
- `anon key`: ローカル開発用のanonキー
- `service_role key`: サービスロールキー

これらの値を `.env.local` に設定してください。

### ローカルSupabaseの停止

```bash
# ローカルSupabaseインスタンスを停止
supabase stop
```

このコマンドを実行すると、ローカルのSupabaseインスタンスが停止します。

### ローカルSupabaseの状態確認

```bash
# ローカルSupabaseの状態を確認
supabase status
```

実行中の場合、接続情報が表示されます。停止中の場合、エラーメッセージが表示されます。

## マイグレーションの実行方法

### Supabase CLIを使用する場合

**重要**: マイグレーションを実行する前に、`supabase start --workdir .` でローカルインスタンスを起動してください。

```bash
# ローカルSupabaseを起動（まだの場合）
supabase start --workdir .

# マイグレーションをローカルに適用（データベースをリセットして全マイグレーションを適用）
supabase db reset

# 特定のマイグレーションを適用
supabase migration up

# マイグレーションの状態を確認
supabase migration list
```

### Supabaseダッシュボードを使用する場合

1. Supabaseダッシュボードにログイン
2. `SQL Editor` を開く
3. `supabase/migrations/` ディレクトリ内のSQLファイルを順番に実行

## マイグレーションファイル

- `20240101000000_create_chat_messages_table.sql`: チャットメッセージテーブルの作成とRealtime設定

## 注意事項

- マイグレーションファイルは時系列順に実行されます（ファイル名のタイムスタンプ順）
- 本番環境に適用する前に、必ずローカル環境でテストしてください
- マイグレーションファイルは一度実行されると、Supabaseが実行履歴を管理します
