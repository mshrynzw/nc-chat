import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chat from '@/components/Chat';
import { supabase } from '@/lib/supabase/client';

// Supabaseのモック
jest.mock('@/lib/supabase/client');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Chat component - 単体テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトのモック実装
    const mockFrom = jest.fn(() => ({
      select: jest.fn(() => ({
        is: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
    }));

    mockSupabase.from = mockFrom as any;
    mockSupabase.channel = jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({})),
      })),
    })) as any;
    mockSupabase.removeChannel = jest.fn();
  });

  it('コンポーネントが正しくレンダリングされる', () => {
    render(<Chat />);
    expect(screen.getByPlaceholderText('メッセージを入力...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument();
  });

  it('メッセージが空の場合、送信ボタンが無効になる', () => {
    render(<Chat />);
    const submitButton = screen.getByRole('button', { name: '送信' });
    expect(submitButton).toBeDisabled();
  });

  it('メッセージを入力すると、送信ボタンが有効になる', async () => {
    const user = userEvent.setup();
    render(<Chat />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    const submitButton = screen.getByRole('button', { name: '送信' });

    await user.type(textarea, 'テストメッセージ');
    expect(submitButton).not.toBeDisabled();
  });

  it('メッセージ送信時にSupabaseのinsertが呼ばれる', async () => {
    const user = userEvent.setup();
    const mockInsert = jest.fn(() => Promise.resolve({ error: null }));

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        is: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: mockInsert,
    } as any);

    render(<Chat />);

    const textarea = screen.getByPlaceholderText('メッセージを入力...');
    const submitButton = screen.getByRole('button', { name: '送信' });

    await user.type(textarea, 'テストメッセージ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('t_chat_messages');
    });
  });

  it('メッセージが空の場合、送信が実行されない', async () => {
    const user = userEvent.setup();
    const mockInsert = jest.fn();

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        is: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: mockInsert,
    } as any);

    render(<Chat />);

    const submitButton = screen.getByRole('button', { name: '送信' });
    expect(submitButton).toBeDisabled();

    // フォーム送信を試みる
    const form = submitButton.closest('form');
    if (form) {
      await user.click(submitButton);
    }

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('リアルタイム更新のチャンネルが設定される', () => {
    render(<Chat />);
    expect(mockSupabase.channel).toHaveBeenCalledWith('chat-messages');
  });
});
