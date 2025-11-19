export const revalidate = 60; // 60秒ごとに再生成

export default async function IsrPage() {
  const now = new Date().toISOString();

  return (
    <main style={{ padding: 24 }}>
      <h1>ISR テスト</h1>
      <p>最初のリクエスト時に生成されて、その後60秒は同じHTML。</p>
      <p>60秒経つと、次のリクエストで新しいHTMLに差し替えられます。</p>
      <p>生成時刻: {now}</p>
    </main>
  );
}
