export default function Loading() {
  return (
    <main>
      <section style={{ 
        background: 'var(--color-dark)', 
        padding: '100px 20px 80px', 
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ 
          width: '300px', 
          height: '40px', 
          background: 'rgba(255,255,255,0.1)', 
          margin: '0 auto 16px',
          borderRadius: '8px',
          animation: 'pulse 1.5s infinite ease-in-out'
        }} />
        <div style={{ 
          width: '400px', 
          height: '20px', 
          background: 'rgba(255,255,255,0.05)', 
          margin: '0 auto',
          borderRadius: '4px',
          animation: 'pulse 1.5s infinite ease-in-out'
        }} />
      </section>

      <section className="container" style={{ padding: '80px 0' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '32px' 
        }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ 
              height: '380px', 
              background: 'var(--color-surface)', 
              borderRadius: '16px', 
              boxShadow: 'var(--shadow-sm)',
              animation: 'pulse 1.5s infinite ease-in-out'
            }} />
          ))}
        </div>
      </section>
    </main>
  );
}
