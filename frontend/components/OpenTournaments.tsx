'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { api, errorMessage, fetcher, OpenTournament, Team } from '@/lib/api';
import { FORMATOS, MODALIDADES, STATUS_INSCRICAO } from '@/lib/labels';

export default function OpenTournaments({ teams }: { teams: Team[] }) {
  const { data, error, mutate } = useSWR<OpenTournament[]>('/tournaments/open', fetcher, { refreshInterval: 15000 });
  const [escolha, setEscolha] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);

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

  if (error) return <div className="alert alert-danger">{errorMessage(error)}</div>;
  if (!data) return <div className="spinner-border text-success" />;
  if (data.length === 0) return <p style={{ color: 'var(--lf-muted)' }}>Nenhum campeonato com inscrições abertas no momento.</p>;

  const nomeTime = (teamId: string) => teams.find((x) => x.id === teamId)?.name ?? 'Seu time';

  return (
    <>
      {msg && <div className={`alert alert-${msg.tipo} py-2`}>{msg.texto}</div>}
      <div className="row g-3">
        {data.map((t) => {
          const ocupados = new Set(t.myEnrollments.filter((e) => e.status !== 'RECUSADA').map((e) => e.teamId));
          const disponiveis = teams.filter((tm) => !ocupados.has(tm.id));
          const lotado = t.accepted >= t.slots;
          const selecionado = escolha[t.id] ?? disponiveis[0]?.id ?? '';

          return (
            <div key={t.id} className="col-12 col-lg-6">
              <div className="lf-card p-3 h-100">
                <h5 className="fw-bold mb-1">{t.name}</h5>
                <small className="d-block mb-2" style={{ color: 'var(--lf-muted)' }}>Organizador: {t.organizer?.name}</small>
                <div className="d-flex gap-2 flex-wrap mb-2">
                  <span className="badge text-bg-success">{MODALIDADES[t.modality]}</span>
                  <span className="badge text-bg-primary">{FORMATOS[t.format]}</span>
                  <span className="badge text-bg-secondary">{t.accepted}/{t.slots} vagas preenchidas</span>
                </div>

                {t.myEnrollments.map((e) => (
                  <div key={e.id} className="d-flex justify-content-between align-items-center small mt-2">
                    <span>{nomeTime(e.teamId)}</span>
                    <span className="d-flex gap-2 align-items-center">
                      <span className={`badge text-bg-${STATUS_INSCRICAO[e.status].cor}`}>{STATUS_INSCRICAO[e.status].texto}</span>
                      {e.status === 'PENDENTE' && (
                        <button className="btn btn-sm btn-link text-danger p-0" onClick={() => acao(() => api.delete(`/tournaments/${t.id}/enrollments/${e.id}`), 'Pedido cancelado')}>
                          Cancelar
                        </button>
                      )}
                    </span>
                  </div>
                ))}

                {teams.length === 0 ? (
                  <small className="d-block mt-3" style={{ color: 'var(--lf-muted)' }}>Crie um time acima para se inscrever.</small>
                ) : lotado ? (
                  <small className="d-block mt-3" style={{ color: 'var(--lf-muted)' }}>Todas as vagas foram preenchidas.</small>
                ) : disponiveis.length > 0 ? (
                  <div className="d-flex gap-2 mt-3">
                    {disponiveis.length > 1 && (
                      <select className="form-select form-select-sm" value={selecionado} onChange={(e) => setEscolha({ ...escolha, [t.id]: e.target.value })}>
                        {disponiveis.map((tm) => (
                          <option key={tm.id} value={tm.id}>{tm.name}</option>
                        ))}
                      </select>
                    )}
                    <button
                      className="btn btn-sm btn-lf text-nowrap"
                      onClick={() => acao(() => api.post(`/tournaments/${t.id}/enrollments`, { teamId: selecionado }), 'Pedido enviado ao organizador')}
                    >
                      {disponiveis.length === 1 ? `Inscrever ${disponiveis[0].name}` : 'Solicitar inscrição'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}