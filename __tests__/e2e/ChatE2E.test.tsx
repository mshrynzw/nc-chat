import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chat from '@/components/Chat';
import { supabase } from '@/lib/supabase/client';
import { type ChatMessage } from '@/schemas/chat';

// Supabaseのモック
jest.mock('@/lib/supabase/client');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Realtime payload の型定義
type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: ChatMessage & { created_at: string; updated_at: string; deleted_at: string | null };
  old?: { id: string };
};

// チャンネルモックの型定義
type MockChannel = {
  on: jest.Mock<{ subscribe: jest.Mock }, [string, unknown, (payload: RealtimePayload) => void]>;
};

describe('Chat E2E - 総合テスト', () => {
  let mockChannel: MockChannel;
  let mockCallback: ((payload: RealtimePayload) => void) | undefined;
  let mockMessages: Array<
    ChatMessage & { created_at: string; updated_at: string; deleted_at: string | null }
  >;

  // 有効なUUID v4形式を生成する関数
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMessages = [];

    // チャンネルコールバックを保存
    mockChannel = {
      on: jest.fn((event, config, callback) => {
        mockCallback = callback;
        return {
          subscribe: jest.fn(() => ({})),
        };
      }),
    };

    mockSupabase.channel = jest.fn(() => mockChannel) as unknown as jest.MockedFunction<
      typeof mockSupabase.channel
    >;
    mockSupabase.removeChannel = jest.fn();

    // メッセージ取得のモック
    const mockSelect = jest.fn(() => ({
      is: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: mockMessages, error: null })),
      })),
    }));

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      insert: jest.fn((data: Array<{ message: string }>) => {
        const newMessage = {
          id: generateUUID(),
          message: data[0].message,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        };
        mockMessages.push(newMessage);
        return Promise.resolve({ error: null });
      }),
    });
  });

  it('完全なチャットフロー: 初期表示 → メッセージ送信 → リアルタイム更新', async () => {
    const user = userEvent.setup();

    // 初期メッセージを設定
    mockMessages = [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        message: '初期メッセージ',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        deleted_at: null,
      },
    ];

    render(<Chat />);

    // 1. 初期メッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('初期メッセージ')).toBeInTheDocument();
    });

    // 2. 新しいメッセージを送信
    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    const submitButton = screen.getByRole('button', { name: '送信' });

    await user.type(textarea, '新しいメッセージ');
    await user.click(submitButton);

    // 3. 送信後、テキストエリアがクリアされる
    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });

    // 4. リアルタイム更新でメッセージが追加される
    if (mockCallback) {
      const newMessage = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        message: '新しいメッセージ',
        created_at: '2024-01-01T01:00:00.000Z',
        updated_at: '2024-01-01T01:00:00.000Z',
        deleted_at: null,
      };

      if (mockCallback) {
        await act(async () => {
          mockCallback!({
            eventType: 'INSERT',
            new: newMessage,
          });
        });
      }
    }

    await waitFor(() => {
      expect(screen.getByText('新しいメッセージ')).toBeInTheDocument();
    });

    // 5. 両方のメッセージが表示されている
    expect(screen.getByText('初期メッセージ')).toBeInTheDocument();
    expect(screen.getByText('新しいメッセージ')).toBeInTheDocument();
  });

  it('複数メッセージの送信と表示順序', async () => {
    const user = userEvent.setup();

    // 有効なUUID v4形式を生成する関数
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };

    render(<Chat />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    const submitButton = screen.getByRole('button', { name: '送信' });

    // 複数のメッセージを送信
    const messages = ['メッセージ1', 'メッセージ2', 'メッセージ3'];

    for (const msg of messages) {
      await user.type(textarea, msg);
      await user.click(submitButton);

      // リアルタイム更新をシミュレート
      if (mockCallback) {
        const newMessage = {
          id: generateUUID(),
          message: msg,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        };

        await act(async () => {
          mockCallback!({
            eventType: 'INSERT',
            new: newMessage,
          });
        });
      }

      await waitFor(() => {
        expect(screen.getByText(msg)).toBeInTheDocument();
      });
    }

    // すべてのメッセージが表示されている
    messages.forEach((msg) => {
      expect(screen.getByText(msg)).toBeInTheDocument();
    });
  });

  it('メッセージ送信中のローディング状態', async () => {
    const user = userEvent.setup();

    // 遅延するinsertをモック
    const mockInsert = jest.fn(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ error: null }), 100);
        }),
    );

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        is: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: mockInsert,
    });

    render(<Chat />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    const submitButton = screen.getByRole('button', { name: '送信' });

    await user.type(textarea, 'ローディングテスト');
    await user.click(submitButton);

    // ローディング中はボタンが無効になる
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '送信中...' })).toBeInTheDocument();
    });

    // ローディング完了後、ボタンが有効に戻る
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument();
    });
  });

  it('エラー発生時の処理', async () => {
    const user = userEvent.setup();

    // エラーを返すinsertをモック
    const mockInsert = jest.fn(() => Promise.resolve({ error: { message: 'データベースエラー' } }));

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        is: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: mockInsert,
    });

    render(<Chat />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    const submitButton = screen.getByRole('button', { name: '送信' });

    await user.type(textarea, 'エラーテスト');
    await user.click(submitButton);

    // Alertコンポーネントでエラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('データベースエラー')).toBeInTheDocument();
    });
  });

  it('メッセージが空の場合の表示', () => {
    render(<Chat />);

    expect(screen.getByText('メッセージがありません')).toBeInTheDocument();
  });

  it('メッセージの日時表示', async () => {
    const testDate = '2024-01-01T12:34:56.000Z';
    mockMessages = [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        message: '日時テスト',
        created_at: testDate,
        updated_at: testDate,
        deleted_at: null,
      },
    ];

    render(<Chat />);

    await waitFor(() => {
      expect(screen.getByText('日時テスト')).toBeInTheDocument();
    });

    // 日時が表示されていることを確認（ロケール形式）
    const messageElement = screen.getByText('日時テスト').closest('div');
    if (messageElement) {
      const dateText = within(messageElement).getByText(/2024/);
      expect(dateText).toBeInTheDocument();
    }
  });
});
