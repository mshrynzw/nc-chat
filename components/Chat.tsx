'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase/client';
import { chatMessageSchema, createChatMessageSchema, type ChatMessage } from '@/schemas/chat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ChatProps {
  initialMessages?: ChatMessage[];
}

export default function Chat({ initialMessages = [] }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    resolver: zodResolver(createChatMessageSchema),
    defaultValues: {
      message: '',
    },
  });

  // メッセージ一覧を取得
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('t_chat_messages')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        // エラーオブジェクトをそのまま投げる（詳細情報を保持）
        throw error;
      }

      if (data) {
        const validatedMessages = data
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

        setMessages(validatedMessages);
      }
    } catch (error: any) {
      // エラーの詳細情報を取得
      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code || error?.status || 'N/A';
      const errorDetails = error?.details || error?.hint || '';

      console.error('メッセージの取得に失敗しました:', {
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
        error: error,
      });

      // より詳細なエラーメッセージを表示
      if (errorCode === 'PGRST301' || error?.code === 'PGRST301') {
        console.error(
          '認証エラー: Supabaseの認証キーが無効です。\n' +
            '以下の点を確認してください:\n' +
            '1. .env.local ファイルに NEXT_PUBLIC_SUPABASE_ANON_KEY が正しく設定されているか\n' +
            '2. ローカルSupabaseを使用している場合、supabase start を実行して正しいキーを取得しているか\n' +
            '3. リモートSupabaseを使用している場合、ダッシュボードから正しい anon public key をコピーしているか\n' +
            `エラー詳細: ${errorMessage}`,
        );
      } else if (errorCode === 401 || error?.status === 401) {
        console.error(
          '認証エラー: Supabaseへの接続が拒否されました。\n' +
            '環境変数を確認してください。\n' +
            `エラー詳細: ${errorMessage}`,
        );
      } else if (errorCode === '42P01' || errorMessage?.includes('does not exist')) {
        console.error(
          'データベースエラー: テーブルが存在しません。\n' +
            '以下の手順でテーブルを作成してください:\n\n' +
            '【ローカルSupabaseの場合】\n' +
            '1. ターミナルで以下のコマンドを実行:\n' +
            '   supabase db reset\n\n' +
            '【リモートSupabaseの場合】\n' +
            '1. Supabaseダッシュボードにログイン\n' +
            '2. SQL Editor を開く\n' +
            '3. supabase/migrations/20240101000000_create_chat_messages_table.sql の内容を実行\n\n' +
            `エラー詳細: ${errorMessage}`,
        );
      } else if (errorMessage) {
        console.error(`エラー: ${errorMessage}`);
        if (errorDetails) {
          console.error(`詳細: ${errorDetails}`);
        }
      }
    }
  };

  // メッセージ送信
  const onSubmit = async (data: { message: string }) => {
    setError(null);
    setIsLoading(true);
    try {
      const { error: insertError } = await supabase.from('t_chat_messages').insert([
        {
          message: data.message,
        },
      ]);

      if (insertError) throw insertError;

      form.reset();
    } catch (err: any) {
      console.error('メッセージの送信に失敗しました:', err);
      setError(err?.message || 'メッセージの送信に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // スクロールを最下部に移動
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初回ロード時にメッセージを取得（サーバーサイドで取得済みの場合はスキップ）
  useEffect(() => {
    // サーバーサイドでデータが取得されていない場合のみ取得
    if (initialMessages.length === 0) {
      fetchMessages();
    }
  }, []);

  // リアルタイム更新の設定
  useEffect(() => {
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 't_chat_messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && !payload.new.deleted_at) {
            // 新しいメッセージを追加
            try {
              const newMessage = chatMessageSchema.parse({
                ...payload.new,
                created_at: new Date(payload.new.created_at).toISOString(),
                updated_at: new Date(payload.new.updated_at).toISOString(),
                deleted_at: payload.new.deleted_at
                  ? new Date(payload.new.deleted_at).toISOString()
                  : null,
              });
              setMessages((prev) => [...prev, newMessage]);
            } catch (error) {
              console.error('メッセージの検証に失敗しました:', error);
            }
          } else if (payload.eventType === 'UPDATE') {
            // メッセージを更新（削除された場合は除外）
            if (payload.new.deleted_at) {
              setMessages((prev) => prev.filter((msg) => msg.id !== payload.new.id));
            } else {
              try {
                const updatedMessage = chatMessageSchema.parse({
                  ...payload.new,
                  created_at: new Date(payload.new.created_at).toISOString(),
                  updated_at: new Date(payload.new.updated_at).toISOString(),
                  deleted_at: payload.new.deleted_at
                    ? new Date(payload.new.deleted_at).toISOString()
                    : null,
                });
                setMessages((prev) =>
                  prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)),
                );
              } catch (error) {
                console.error('メッセージの検証に失敗しました:', error);
              }
            }
          } else if (payload.eventType === 'DELETE') {
            // メッセージを削除
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      {/* エラーメッセージ */}
      {error && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* メッセージ一覧 */}
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">メッセージがありません</div>
          ) : (
            messages.map((msg) => (
              <Card key={msg.id}>
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(msg.created_at).toLocaleString('ja-JP')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <Separator />

      {/* メッセージ入力フォーム */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="border-t bg-card px-4 py-4">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex gap-2">
                    <Textarea
                      {...field}
                      placeholder="メッセージを入力..."
                      className="flex-1 resize-none"
                      disabled={isLoading}
                      rows={1}
                    />
                    <Button type="submit" disabled={isLoading || !field.value?.trim()}>
                      {isLoading ? '送信中...' : '送信'}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </>
  );
}
