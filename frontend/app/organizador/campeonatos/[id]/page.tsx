'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Navbar from '@/components/Navbar';
import TeamLogo from '@/components/TeamLogo';
import { api, Enrollment, errorMessage, fetcher, Team, TournamentDetail } from '@/lib/api';
import { DESEMPATES, FORMATOS, MODALIDADES } from '@/lib/labels';
import { useUser } from '@/lib/useUser';

export default function CampeonatoOrganizador() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { data: t, error, mutate } = useSWR<TournamentDetail>(user ? `/tournaments/${id}` : null, fetcher, {
    refreshInterval: 15000,
  });
  const { data: meusTimes } = useSWR<Team[]>(user?.isPlayer ? '/teams' : null, fetcher);
  const [msg, setMsg] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);
  const [timeEscolhido, setTimeEscolhido] = useState('');

  async function acao(fn: () => Promise<unknown>, sucesso: string) {
    setMsg(null);
    try {
      await fn();
      await mutate();
      setMsg({ tipo: 'success', texto: sucesso });
    } catch (err) {
      setMsg({ tipo: 'danger', texto: errorMessage(err) });
    }
  }

  async function excluir() {
    if (!confirm(`Excluir o campeonato ${t!.name}? Essa ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/tournaments/${id}`);
      router.push('/organizador');
    } catch (err) {
      setMsg({ tipo: 'danger', texto: errorMessage(err) });
    }
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="container py-5"><div className="alert alert-danger">{errorMessage(error)}</div></main>
      </>
    );
  }
  if (!t) return <div className="text-center mt-5"><div className="spinner-border text-success" /></div>;
  if (!t.isOrganizer) {
    return (
      <>
        <Navbar />
        <main className="container py-5"><div className="alert alert-warning">Só o organizador pode gerenciar este campeonato.</div></main>
      </>
    );
  }

  const pendentes = t.enrollments.filter((e) => e.status === 'PENDENTE');
  const aceitas = t.enrollments.filter((e) => e.status === 'ACEITA');
  const recusadas = t.enrollments.filter((e) => e.status === 'RECUSADA');
  const inscritos = new Set(t.enrollments.filter((e) => e.status !== 'RECUSADA').map((e) => e.team.id));
  const disponiveis = (meusTimes ?? []).filter((tm) => !inscritos.has(tm.id));
  const lotado = aceitas.length >= t.slots;
  const abertas = t.status === 'INSCRICOES';

  const formatoDetalhe =
    t.format === 'PONTOS_CORRIDOS'
      ? t.homeAndAway ? 'Turno e returno' : 'Turno único'
      : t.format === 'MATA_MATA'
        ? t.homeAndAway ? 'Ida e volta' : 'Jogo único'
        : `${t.groupsCount} grupos, ${t.qualifiersPerGroup} classificado(s) por grupo${t.homeAndAway ? ', mata-mata ida e volta' : ''}`;

  const linhaTime = (e: Enrollment, botoes: React.ReactNode) => (
    <li key={e.id} className="list-group-item d-flex align-items-center gap-3">
      <TeamLogo name={e.team.name} logoUrl={e.team.logoUrl} size={36} />
      <div className="flex-grow-1">
        <div className="fw-semibold">{e.team.name}</div>
        <small style={{ color: 'var(--lf-muted)' }}>Responsável: {e.team.owner.name}</small>
      </div>
      <div className="d-flex gap-2">{botoes}</div>
    </li>
  );

  return (
    <>
      <Navbar />
      <main className="container py-4">
        <Link href="/organizador" className="btn btn-sm btn-outline-light mb-3">
          <i className="bi bi-arrow-left me-1" />Meus campeonatos
        </Link>
        {msg && <div className={`alert alert-${msg.tipo} py-2`}>{msg.texto}</div>}

        <div className="lf-card p-3 mb-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h3 className="fw-bold mb-2">{t.name}</h3>
              <div className="d-flex gap-2 flex-wrap mb-3">
                <span className="badge text-bg-success">{MODALIDADES[t.modality]}</span>
                <span className="badge text-bg-primary">{FORMATOS[t.format]}</span>
                <span className="badge text-bg-secondary">{aceitas.length}/{t.slots} times</span>
              </div>
            </div>
            {abertas && (
              <button className="btn btn-sm btn-outline-danger" onClick={excluir}>
                <i className="bi bi-trash me-1" />Excluir
              </button>
            )}
          </div>
          <ul className="mb-0 small" style={{ color: 'var(--lf-muted)' }}>
            <li>Formato: {formatoDetalhe}</li>
            {t.tiebreakers.length > 0 && <li>Desempate: {t.tiebreakers.map((k) => DESEMPATES[k]).join(' → ')}</li>}
            <li>Suspensão: {t.yellowLimit} amarelos = 1 jogo · vermelho = {t.redSuspension} jogo(s)</li>
          </ul>
        </div>

        {abertas && !lotado && (
          <div className="lf-card p-3 mb-4" style={{ borderColor: 'var(--lf-green)' }}>
            <h5 className="fw-bold mb-2">Você tem um time no LigaFácil?</h5>
            {!user?.isPlayer ? (
              <p className="mb-0" style={{ color: 'var(--lf-muted)' }}>
                Para inscrever um time seu, ative o perfil de jogador em <Link href="/perfil">Perfil</Link>.
              </p>
            ) : !meusTimes ? (
              <div className="spinner-border spinner-border-sm text-success" />
            ) : meusTimes.length === 0 ? (
              <p className="mb-0" style={{ color: 'var(--lf-muted)' }}>
                Você ainda não tem times. <Link href="/jogador">Criar um time</Link>
              </p>
            ) : disponiveis.length === 0 ? (
              <p className="mb-0" style={{ color: 'var(--lf-muted)' }}>Seus times já estão neste campeonato.</p>
            ) : (
              <div className="d-flex gap-2 flex-wrap">
                <select className="form-select" style={{ maxWidth: 320 }} value={timeEscolhido || disponiveis[0].id} onChange={(e) => setTimeEscolhido(e.target.value)}>
                  {disponiveis.map((tm) => (
                    <option key={tm.id} value={tm.id}>{tm.name}</option>
                  ))}
                </select>
                <button
                  className="btn btn-lf"
                  onClick={() => acao(() => api.post(`/tournaments/${id}/enrollments`, { teamId: timeEscolhido || disponiveis[0].id }), 'Seu time foi inscrito')}
                >
                  Inscrever meu time
                </button>
              </div>
            )}
          </div>
        )}

        <h5 className="fw-bold mb-2">Pedidos pendentes ({pendentes.length})</h5>
        {pendentes.length === 0 ? (
          <p style={{ color: 'var(--lf-muted)' }}>Nenhum pedido aguardando.</p>
        ) : (
          <ul className="list-group mb-4">
            {pendentes.map((e) =>
              linhaTime(
                e,
                <>
                  <button className="btn btn-sm btn-lf" disabled={lotado} onClick={() => acao(() => api.patch(`/tournaments/${id}/enrollments/${e.id}`, { status: 'ACEITA' }), `${e.team.name} confirmado`)}>
                    Aceitar
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => acao(() => api.patch(`/tournaments/${id}/enrollments/${e.id}`, { status: 'RECUSADA' }), `${e.team.name} recusado`)}>
                    Recusar
                  </button>
                </>,
              ),
            )}
          </ul>
        )}

        <h5 className="fw-bold mb-2 mt-4">Times confirmados ({aceitas.length}/{t.slots})</h5>
        {aceitas.length === 0 ? (
          <p style={{ color: 'var(--lf-muted)' }}>Nenhum time confirmado ainda.</p>
        ) : (
          <ul className="list-group mb-4">
            {aceitas.map((e) =>
              linhaTime(
                e,
                abertas && (
                  <button
                    className="btn btn-sm btn-outline-danger"
                    title="Remover do campeonato"
                    onClick={() => confirm(`Remover ${e.team.name}?`) && acao(() => api.delete(`/tournaments/${id}/enrollments/${e.id}`), `${e.team.name} removido`)}
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                ),
              ),
            )}
          </ul>
        )}

        {recusadas.length > 0 && (
          <>
            <h6 className="fw-bold mt-4" style={{ color: 'var(--lf-muted)' }}>Recusados ({recusadas.length})</h6>
            <ul className="list-group mb-4 opacity-75">{recusadas.map((e) => linhaTime(e, null))}</ul>
          </>
        )}

        <div className="lf-card p-3 mt-4" style={{ color: 'var(--lf-muted)' }}>
          <i className="bi bi-calendar3 me-2" />Tabela e calendário de jogos: Fase 5.
        </div>
      </main>
    </>
  );
}