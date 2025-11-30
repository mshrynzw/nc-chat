import { z } from 'zod';

// チャットメッセージのZodスキーマ
export const chatMessageSchema = z.object({
  id: z.string().uuid(),
  message: z.string().min(1, 'メッセージは必須です'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
});

// メッセージ送信用のスキーマ（id, created_at, updated_at, deleted_atは自動生成）
export const createChatMessageSchema = z.object({
  message: z.string().trim().min(1, 'メッセージは必須です'),
});

// 型定義
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type CreateChatMessage = z.infer<typeof createChatMessageSchema>;
