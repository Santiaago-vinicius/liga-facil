'use client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/useUser';

export default function Hub() {
  const { user, isLoading, error } = useUser();
  if (error && !user) {
    return (
      <main className="container py-5 text-center">
        <div className="alert alert-warning d-inline-block">
          O servidor está demorando para responder. Aguarde alguns segundos e recarregue a página.
        </div>
      </main>
    );
  }
  if (isLoading || !user) return <div className="text-center mt-5"><div className="spinner-border text-success" /></div>;

  return (
    <>
      <Navbar />
      <main className="container py-5">
        <h2 className="fw-bold mb-1">Olá, {user.name.split(' ')[0]}!</h2>
        <p className="mb-4" style={{ color: 'var(--lf-muted)' }}>Escolha onde quer entrar.</p>
        <div className="row g-4">
          {user.isPlayer && (
            <div className="col-12 col-md-6">
              <Link href="/jogador" className="lf-card p-4 d-block text-decoration-none text-reset h-100">
                <i className="bi bi-person-badge fs-1 text-success" />
                <h4 className="fw-bold mt-2">Jogador</h4>
                <p className="mb-0" style={{ color: 'var(--lf-muted)' }}>Seus times, inscrições e escalações.</p>
              </Link>
            </div>
          )}
          {user.isOrganizer && (
            <div className="col-12 col-md-6">
              <Link href="/organizador" className="lf-card p-4 d-block text-decoration-none text-reset h-100">
                <i className="bi bi-clipboard-data fs-1 text-primary" />
                <h4 className="fw-bold mt-2">Organizador</h4>
                <p className="mb-0" style={{ color: 'var(--lf-muted)' }}>Crie e gerencie seus campeonatos.</p>
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}