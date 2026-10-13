'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/api';

export default function Navbar() {
  const router = useRouter();

  function sair() {
    clearSession();
    router.push('/');
  }

  return (
    <nav className="navbar border-bottom" style={{ borderColor: 'var(--lf-border)', background: 'var(--lf-surface)' }}>
      <div className="container">
        <Link href="/hub" className="navbar-brand fw-bold">
          <i className="bi bi-trophy-fill text-success me-2" />LigaFácil
        </Link>
        <div className="d-flex gap-2">
          <Link href="/perfil" className="btn btn-sm btn-outline-light">
            <i className="bi bi-person me-1" />Perfil
          </Link>
          <button onClick={sair} className="btn btn-sm btn-outline-danger">
            <i className="bi bi-box-arrow-right me-1" />Sair
          </button>
        </div>
      </div>
    </nav>
  );
}