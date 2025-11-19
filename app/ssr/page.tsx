export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function SsrPage() {
  const now = new Date().toISOString();

  return (
    <main style={{ padding: 24 }}>
      <h1>SSR テスト</h1>
      <p>毎回リクエストごとにサーバーでレンダリングされます。</p>
      <p>サーバー時刻: {now}</p>
    </main>
  );
}
