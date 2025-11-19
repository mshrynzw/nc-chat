export const revalidate = 5; // 5秒に短くする

export default function IsrPage() {
  const now = new Date().toISOString();
  return (
    <main style={{ padding: 24, color: 'white', background: 'black' }}>
      <h1>ISR テスト</h1>
      <p>最初のリクエスト時に生成されて、その後5秒は同じHTML。</p>
      <p>5秒経つと、次のリクエストで新しいHTMLに差し替えられます。</p>
      <p>生成時刻: {now}</p>
    </main>
  );
}
