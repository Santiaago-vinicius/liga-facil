'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import Navbar from '@/components/Navbar';
import TeamLogo from '@/components/TeamLogo';
import { api, errorMessage, fetcher, Team } from '@/lib/api';
import { resizeImage } from '@/lib/image';
import { useUser } from '@/lib/useUser';
import OpenTournaments from '@/components/OpenTournaments';

export default function Jogador() {
  const { user } = useUser();
  const { data: teams, mutate } = useSWR<Team[]>(user ? '/teams' : null, fetcher);
  const [aberto, setAberto] = useState(false);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function escolherLogo(file?: File) {
    if (!file) return;
    try {
      setLogo(await resizeImage(file));
    } catch {
      setErro('Não foi possível ler essa imagem');
    }
  }

  async function criar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api.post('/teams', { name, logoUrl: logo });
      await mutate();
      setName('');
      setLogo(null);
      setAberto(false);
    } catch (err) {
      setErro(errorMessage(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="fw-bold mb-0">Meus times</h3>
          <button className="btn btn-lf" onClick={() => setAberto(!aberto)}>
            <i className={`bi ${aberto ? 'bi-x-lg' : 'bi-plus-lg'} me-1`} />
            {aberto ? 'Cancelar' : 'Novo time'}
          </button>
        </div>

        {aberto && (
          <form onSubmit={criar} className="lf-card p-3 mb-4">
            {erro && <div className="alert alert-danger py-2">{erro}</div>}
            <div className="d-flex gap-3 align-items-center flex-wrap">
              <TeamLogo name={name || '?'} logoUrl={logo} size={64} />
              <div className="flex-grow-1">
                <input className="form-control mb-2" placeholder="Nome do time" required value={name} onChange={(e) => setName(e.target.value)} />
                <input className="form-control form-control-sm" type="file" accept="image/*" onChange={(e) => escolherLogo(e.target.files?.[0])} />
              </div>
            </div>
            <button className="btn btn-lf mt-3" disabled={salvando}>{salvando ? 'Salvando...' : 'Criar time'}</button>
          </form>
        )}

        {!teams ? (
          <div className="spinner-border text-success" />
        ) : teams.length === 0 ? (
          <p style={{ color: 'var(--lf-muted)' }}>Você ainda não criou nenhum time.</p>
        ) : (
          <div className="row g-3">
            {teams.map((t) => (
              <div key={t.id} className="col-12 col-sm-6 col-lg-4">
                <Link href={`/jogador/times/${t.id}`} className="lf-card p-3 d-flex align-items-center gap-3 text-decoration-none text-reset h-100">
                  <TeamLogo name={t.name} logoUrl={t.logoUrl} />
                  <div>
                    <h5 className="fw-bold mb-0">{t.name}</h5>
                    <small style={{ color: 'var(--lf-muted)' }}>{t._count?.players ?? 0} jogadores</small>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}

        <h3 className="fw-bold mt-5 mb-3">Campeonatos abertos</h3>
        <OpenTournaments teams={teams ?? []} />
      </main>
    </>
  );
}