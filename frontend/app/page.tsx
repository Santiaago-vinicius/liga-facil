import Link from 'next/link';

export default function Home() {
  return (
    <main className="container d-flex flex-column align-items-center justify-content-center min-vh-100 text-center">
      <h1 className="fw-bold mb-2">
        <i className="bi bi-trophy-fill text-success me-2" />
        LigaFácil
      </h1>
      <p className="mb-4" style={{ color: 'var(--lf-muted)' }}>
        Gerencie campeonatos de futsal, fut7, futebol 11 e areia.
      </p>
      <div className="d-flex gap-3">
        <Link href="/cadastro" className="btn btn-lf px-4">Novo cadastro</Link>
        <Link href="/login" className="btn btn-outline-light px-4">Login</Link>
      </div>
    </main>
  );
}