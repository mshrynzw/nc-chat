import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Chat from '@/components/Chat';
import { supabase } from '@/lib/supabase/client';

// Supabaseのモック
jest.mock('@/lib/supabase/client');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Chat Integration - 結合テスト', () => {
  let mockChannel: any;
  let mockCallback: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // チャンネルコールバックを保存
    mockChannel = {
      on: jest.fn((event, config, callback) => {
        mockCallback = callback;
        return {
          subscribe: jest.fn(() => ({})),
        };
      }),
    };

    mockSupabase.channel = jest.fn(() => mockChannel) as any;
    mockSupabase.removeChannel = jest.fn();
  });

  it('メッセージ取得と表示の統合テスト', async () => {
    const mockMessages = [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        message: 'メッセージ1',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        deleted_at: null,
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174002',
        message: 'メッセージ2',
        created_at: '2024-01-01T01:00:00.000Z',
        updated_at: '2024-01-01T01:00:00.000Z',
        deleted_at: null,
      },
    ];

    const mockSelect = jest.fn(() => ({
      is: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: mockMessages, error: null })),
      })),
    }));

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      insert: jest.fn(() => Promise.resolve({ error: null })),
    } as any);

    render(<Chat />);

    await waitFor(() => {
      expect(screen.getByText('メッセージ1')).toBeInTheDocument();
      expect(screen.getByText('メッセージ2')).toBeInTheDocument();
    });
  });

  it('メッセージ送信とリアルタイム更新の統合テスト', async () => {
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

    await user.type(textarea, '新しいメッセージ');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([{ message: '新しいメッセージ' }]);
    });
  });

  it('リアルタイム更新でメッセージが追加される', async () => {
    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        is: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
    } as any);

    render(<Chat />);

    // チャンネルが設定され、コールバックが登録されるまで待つ
    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled();
      expect(mockCallback).toBeDefined();
    });

    // リアルタイム更新のコールバックをシミュレート
    const newMessage = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      message: 'リアルタイムメッセージ',
      created_at: '2024-01-01T02:00:00.000Z',
      updated_at: '2024-01-01T02:00:00.000Z',
      deleted_at: null,
    };

    await act(async () => {
      mockCallback({
        eventType: 'INSERT',
        new: newMessage,
      });
    });

    await waitFor(
      () => {
        expect(screen.getByText('リアルタイムメッセージ')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('削除されたメッセージがリアルタイムで除外される', async () => {
    const initialMessages = [
      {
        id: '123e4567-e89b-12d3-a456-426614174001',
        message: 'メッセージ1',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        deleted_at: null,
      },
    ];

    (mockSupabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        is: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: initialMessages, error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
    } as any);

    render(<Chat />);

    await waitFor(() => {
      expect(screen.getByText('メッセージ1')).toBeInTheDocument();
    });

    // 削除イベントをシミュレート
    if (mockCallback) {
      await act(async () => {
        mockCallback({
          eventType: 'UPDATE',
          new: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            message: 'メッセージ1',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            deleted_at: '2024-01-01T03:00:00.000Z',
          },
        });
      });
    }

    await waitFor(() => {
      expect(screen.queryByText('メッセージ1')).not.toBeInTheDocument();
    });
  });

  it('バリデーションエラー時にメッセージが送信されない', async () => {
    const user = userEvent.setup();
    const mockInsert = jest.fn();

    // alertをモック
    window.alert = jest.fn();

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

    // 空のメッセージで送信を試みる（ボタンは無効だが、フォーム送信をシミュレート）
    await user.type(textarea, '   '); // 空白のみ
    await user.clear(textarea);

    // 送信ボタンが無効であることを確認
    expect(submitButton).toBeDisabled();
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
