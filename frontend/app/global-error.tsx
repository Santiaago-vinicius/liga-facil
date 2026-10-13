'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ background: '#0b0f14', color: '#e5e7eb', fontFamily: 'sans-serif', textAlign: 'center', paddingTop: '20vh' }}>
        <h2>Algo deu errado</h2>
        <p style={{ color: '#9ca3af' }}>Tente novamente em instantes.</p>
        <button onClick={reset} style={{ background: '#16a34a', color: '#fff', border: 0, padding: '10px 24px', borderRadius: 8, cursor: 'pointer' }}>
          Tentar de novo
        </button>
      </body>
    </html>
  );
}