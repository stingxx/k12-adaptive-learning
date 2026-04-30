export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '60px 40px',
        maxWidth: '600px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h1 style={{ fontSize: '48px', margin: '0 0 20px 0', color: '#333' }}>
          🎓 K-12 学习平台
        </h1>
        <p style={{ fontSize: '20px', color: '#666', marginBottom: '30px' }}>
          加拿大 K-12 AI 自适应学习平台
        </p>
        <div style={{
          background: '#f0f4ff',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
        }}>
          <p style={{ margin: 0, color: '#667eea', fontWeight: 'bold' }}>
            ✅ 部署成功！
          </p>
        </div>
        <p style={{ color: '#999', fontSize: '14px' }}>
          数学 · 科学 · 英语 · 社会研究
        </p>
      </div>
    </main>
  );
}
