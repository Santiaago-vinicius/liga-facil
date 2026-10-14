'use client';
import Link from 'next/link';
import useSWR from 'swr';
import Navbar from '@/components/Navbar';
import { errorMessage, fetcher, MyTournament } from '@/lib/api';
import { FORMATOS, MODALIDADES } from '@/lib/labels';
import { useUser } from '@/lib/useUser';

export default function Organizador() {
  const { user } = useUser();
  const { data, error } = useSWR<MyTournament[]>(user ? '/tournaments/mine' : null, fetcher);

  return (
    <>
      <Navbar />
      <main className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold mb-0">Meus campeonatos</h3>
          <Link href="/organizador/novo" className="btn btn-lf">
            <i className="bi bi-plus-lg me-1" />Novo campeonato
          </Link>
        </div>

        {error ? (
          <div className="alert alert-danger">{errorMessage(error)}</div>
        ) : !data ? (
          <div className="spinner-border text-success" />
        ) : data.length === 0 ? (
          <p style={{ color: 'var(--lf-muted)' }}>Você ainda não criou nenhum campeonato.</p>
        ) : (
          <div className="row g-3">
            {data.map((t) => {
              const aceitas = t.enrollments.filter((e) => e.status === 'ACEITA').length;
              const pendentes = t.enrollments.filter((e) => e.status === 'PENDENTE').length;
              return (
                <div key={t.id} className="col-12 col-md-6 col-lg-4">
                  <Link href={`/organizador/campeonatos/${t.id}`} className="lf-card p-3 d-block text-decoration-none text-reset h-100">
                    <h5 className="fw-bold">{t.name}</h5>
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      <span className="badge text-bg-success">{MODALIDADES[t.modality]}</span>
                      <span className="badge text-bg-primary">{FORMATOS[t.format]}</span>
                    </div>
                    <small style={{ color: 'var(--lf-muted)' }}>
                      {aceitas}/{t.slots} times confirmados
                    </small>
                    {pendentes > 0 && (
                      <span className="badge text-bg-warning ms-2">{pendentes} pedido(s) pendente(s)</span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}