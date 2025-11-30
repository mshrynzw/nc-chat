import { chatMessageSchema, createChatMessageSchema } from '@/schemas/chat';

describe('chat schemas - 単体テスト', () => {
  describe('chatMessageSchema', () => {
    it('有効なメッセージデータを検証できる', () => {
      const validMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        message: 'テストメッセージ',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        deleted_at: null,
      };

      const result = chatMessageSchema.safeParse(validMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validMessage);
      }
    });

    it('deleted_atがnullでない場合も検証できる', () => {
      const messageWithDeletedAt = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        message: '削除されたメッセージ',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        deleted_at: '2024-01-02T00:00:00.000Z',
      };

      const result = chatMessageSchema.safeParse(messageWithDeletedAt);
      expect(result.success).toBe(true);
    });

    it('無効なUUIDでエラーを返す', () => {
      const invalidMessage = {
        id: 'invalid-uuid',
        message: 'テストメッセージ',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        deleted_at: null,
      };

      const result = chatMessageSchema.safeParse(invalidMessage);
      expect(result.success).toBe(false);
    });

    it('空のメッセージでエラーを返す', () => {
      const emptyMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        message: '',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        deleted_at: null,
      };

      const result = chatMessageSchema.safeParse(emptyMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('メッセージは必須です');
      }
    });

    it('無効な日時形式でエラーを返す', () => {
      const invalidDateMessage = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        message: 'テストメッセージ',
        created_at: 'invalid-date',
        updated_at: '2024-01-01T00:00:00.000Z',
        deleted_at: null,
      };

      const result = chatMessageSchema.safeParse(invalidDateMessage);
      expect(result.success).toBe(false);
    });
  });

  describe('createChatMessageSchema', () => {
    it('有効なメッセージ送信データを検証できる', () => {
      const validCreateMessage = {
        message: '新しいメッセージ',
      };

      const result = createChatMessageSchema.safeParse(validCreateMessage);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('新しいメッセージ');
      }
    });

    it('空のメッセージでエラーを返す', () => {
      const emptyMessage = {
        message: '',
      };

      const result = createChatMessageSchema.safeParse(emptyMessage);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('メッセージは必須です');
      }
    });

    it('空白のみのメッセージでエラーを返す', () => {
      const whitespaceMessage = {
        message: '   ',
      };

      const result = createChatMessageSchema.safeParse(whitespaceMessage);
      expect(result.success).toBe(false);
    });

    it('長いメッセージも検証できる', () => {
      const longMessage = {
        message: 'a'.repeat(1000),
      };

      const result = createChatMessageSchema.safeParse(longMessage);
      expect(result.success).toBe(true);
    });
  });
});
