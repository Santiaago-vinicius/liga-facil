import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container text-center" style={{ paddingTop: '20vh' }}>
      <h2 className="fw-bold">Página não encontrada</h2>
      <p style={{ color: 'var(--lf-muted)' }}>O endereço acessado não existe.</p>
      <Link href="/" className="btn btn-lf mt-2">Voltar ao início</Link>
    </main>
  );
}