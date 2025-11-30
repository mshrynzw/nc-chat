-- チャットメッセージテーブルの作成
CREATE TABLE IF NOT EXISTS t_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_atを自動更新するトリガー
CREATE TRIGGER update_t_chat_messages_updated_at
  BEFORE UPDATE ON t_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Realtimeを有効にする
ALTER PUBLICATION supabase_realtime ADD TABLE t_chat_messages;

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_t_chat_messages_created_at ON t_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_t_chat_messages_deleted_at ON t_chat_messages(deleted_at) WHERE deleted_at IS NULL;

