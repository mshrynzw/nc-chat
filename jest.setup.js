import '@testing-library/jest-dom';

// テスト環境用の環境変数を設定
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// scrollIntoViewをモック
global.Element.prototype.scrollIntoView = jest.fn();
