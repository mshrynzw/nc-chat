This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# .env.sample をコピーして .env.local を作成
cp .env.sample .env.local
```

その後、`.env.local` ファイルを開いて、実際のSupabaseの値を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

これらの値は、Supabaseプロジェクトの設定ページから取得できます。

- **Project URL**: `Settings` → `API` → `Project URL`
- **anon public key**: `Settings` → `API` → `Project API keys` → `anon public`

**ローカル開発の場合:**

```bash
# Supabase CLIでローカルインスタンスを起動
supabase start

# 表示される情報から以下をコピー
# - API URL → NEXT_PUBLIC_SUPABASE_URL
# - anon key → NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**重要**: 環境変数を変更した後は、開発サーバーを再起動してください。

### データベーステーブルの作成

#### 方法1: Supabase CLIを使用（推奨）

```bash
# Supabase CLIをインストール（まだの場合）
npm install -g supabase

# ローカルプロジェクトを初期化
supabase init

# マイグレーションを適用
supabase db reset
```

#### 方法2: Supabaseダッシュボードを使用

1. Supabaseダッシュボードにログイン
2. `SQL Editor` を開く
3. `supabase/migrations/20240101000000_create_chat_messages_table.sql` の内容をコピーして実行

#### 方法3: 手動でSQLを実行

Supabaseダッシュボードの `SQL Editor` で以下のSQLを実行：

```sql
CREATE TABLE t_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Realtimeを有効にする
ALTER PUBLICATION supabase_realtime ADD TABLE t_chat_messages;
```

**注意**: マイグレーションファイル（`supabase/migrations/`）には、自動更新トリガーやインデックスも含まれているため、方法1または方法2を推奨します。

### 開発環境でのSupabaseの使い方

#### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスしてアカウントを作成（またはログイン）
2. 新しいプロジェクトを作成
3. プロジェクトの設定ページから以下を取得：
   - **Project URL**: `Settings` → `API` → `Project URL`
   - **anon public key**: `Settings` → `API` → `Project API keys` → `anon public`

#### 2. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成し、取得した値を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**注意**: `.env.local` は `.gitignore` に含まれているため、Gitにはコミットされません。

#### 3. ローカル開発でのSupabase CLI（オプション）

Supabase CLIを使用してローカルで開発する場合：

```bash
# Supabase CLIをインストール
npm install -g supabase

# ローカルプロジェクトを初期化
supabase init

# ローカルSupabaseを起動
supabase start

# ローカル環境変数を取得
supabase status
```

**ローカルSupabaseの起動と停止:**

```bash
# ローカルSupabaseを起動
supabase start

# ローカルSupabaseを停止
supabase stop

# 状態を確認
supabase status
```

**注意**:

- `supabase start` を実行すると、ローカルのPostgreSQLとSupabase APIサーバーが起動します
- 起動後、表示される `API URL` と `anon key` を `.env.local` に設定してください
- 開発が終わったら `supabase stop` で停止できます
- マイグレーションを実行する前に、必ず `supabase start` で起動してください

#### 4. データベースのマイグレーション

このプロジェクトには `supabase/migrations/` ディレクトリにマイグレーションファイルが含まれています。

**Supabase CLIを使用する場合:**

```bash
# マイグレーションをローカルに適用
supabase db reset

# リモート（本番）環境に適用
supabase db push
```

**Supabaseダッシュボードを使用する場合:**

1. `SQL Editor` を開く
2. `supabase/migrations/20240101000000_create_chat_messages_table.sql` の内容をコピーして実行

詳細は `supabase/README.md` を参照してください。

#### 5. Realtimeの設定確認

Supabaseダッシュボードで以下を確認：

- `Database` → `Replication` で `t_chat_messages` テーブルが有効になっていること
- `Settings` → `API` で Realtime が有効になっていること

#### 6. 開発時の注意事項

- 開発環境では `anon` キーを使用（本番環境では適切なRLSポリシーを設定）
- ローカル開発時は `.env.local` を使用
- 本番環境では環境変数を適切に設定（Vercel、Netlify等のプラットフォームの環境変数設定を使用）

### 開発サーバーの起動

環境変数を設定した後、開発サーバーを起動します：

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## テスト

このプロジェクトには単体テスト、結合テスト、総合テストが含まれています。

### テストの実行

```bash
# すべてのテストを実行
npm test

# ウォッチモードで実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage

# 単体テストのみ実行
npm run test:unit

# 結合テストのみ実行
npm run test:integration

# 総合テストのみ実行
npm run test:e2e
```

### テスト構成

- **単体テスト** (`__tests__/unit/`): 個別のコンポーネントやスキーマのテスト
- **結合テスト** (`__tests__/integration/`): 複数のコンポーネントやモジュールの連携テスト
- **総合テスト** (`__tests__/e2e/`): エンドツーエンドのテスト

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
