import Chat from '@/components/Chat';
import { supabase } from '@/lib/supabase/client';
import { chatMessageSchema, type ChatMessage } from '@/schemas/chat';

export default async function Home() {
  // サーバーサイドでメッセージを取得
  let initialMessages: ChatMessage[] = [];

  try {
    const { data, error } = await supabase
      .from('t_chat_messages')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('サーバーサイドでのメッセージ取得エラー:', error);
    } else if (data) {
      initialMessages = data
        .map((msg) => {
          try {
            return chatMessageSchema.parse({
              ...msg,
              created_at: new Date(msg.created_at).toISOString(),
              updated_at: new Date(msg.updated_at).toISOString(),
              deleted_at: msg.deleted_at ? new Date(msg.deleted_at).toISOString() : null,
            });
          } catch {
            return null;
          }
        })
        .filter((msg): msg is ChatMessage => msg !== null);
    }
  } catch (error) {
    console.error('サーバーサイドでのメッセージ取得に失敗しました:', error);
  }

  return <Chat initialMessages={initialMessages} />;
}
