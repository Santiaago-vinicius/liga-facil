'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Navbar from '@/components/Navbar';
import TeamLogo from '@/components/TeamLogo';
import { api, errorMessage, fetcher, TeamDetail, TeamPlayer } from '@/lib/api';
import { resizeImage } from '@/lib/image';
import { useUser } from '@/lib/useUser';

export default function TimeDetalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { data: team, error, mutate } = useSWR<TeamDetail>(user ? `/teams/${id}` : null, fetcher);

  const [msg, setMsg] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [logo, setLogo] = useState<string | null | undefined>(undefined);

  const [modo, setModo] = useState<'email' | 'manual'>('email');
  const [novo, setNovo] = useState({ email: '', name: '', number: '', isCaptain: false });

  async function acao(fn: () => Promise<unknown>, sucesso?: string) {
    setMsg(null);
    try {
      await fn();
      await mutate();
      if (sucesso) setMsg({ tipo: 'success', texto: sucesso });
      return true;
    } catch (err) {
      setMsg({ tipo: 'danger', texto: errorMessage(err) });
      return false;
    }
  }

  function abrirEdicao() {
    setNome(team!.name);
    setLogo(undefined);
    setEditando(true);
  }

  async function salvarTime(e: FormEvent) {
    e.preventDefault();
    const ok = await acao(() => api.put(`/teams/${id}`, { name: nome, ...(logo !== undefined && { logoUrl: logo }) }), 'Time atualizado');
    if (ok) setEditando(false);
  }

  async function excluirTime() {
    if (!confirm(`Excluir o time ${team!.name}? Essa ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/teams/${id}`);
      router.push('/jogador');
    } catch (err) {
      setMsg({ tipo: 'danger', texto: errorMessage(err) });
    }
  }

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    const body = {
      ...(modo === 'email' ? { email: novo.email } : { name: novo.name }),
      number: novo.number === '' ? null : Number(novo.number),
      isCaptain: novo.isCaptain,
    };
    const ok = await acao(() => api.post(`/teams/${id}/players`, body), 'Jogador adicionado');
    if (ok) setNovo({ email: '', name: '', number: '', isCaptain: false });
  }

  function salvarNumero(p: TeamPlayer, valor: string) {
    const number = valor === '' ? null : Number(valor);
    if (number === p.number) return;
    acao(() => api.put(`/teams/${id}/players/${p.id}`, { number }));
  }

  function alternarCapitao(p: TeamPlayer) {
    acao(() => api.put(`/teams/${id}/players/${p.id}`, { isCaptain: !p.isCaptain }));
  }

  function remover(p: TeamPlayer) {
    if (!confirm(`Remover ${p.name} do time?`)) return;
    acao(() => api.delete(`/teams/${id}/players/${p.id}`), 'Jogador removido');
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="container py-5"><div className="alert alert-danger">{errorMessage(error)}</div></main>
      </>
    );
  }
  if (!team) return <div className="text-center mt-5"><div className="spinner-border text-success" /></div>;

  return (
    <>
      <Navbar />
      <main className="container py-4">
        <Link href="/jogador" className="btn btn-sm btn-outline-light mb-3">
          <i className="bi bi-arrow-left me-1" />Meus times
        </Link>
        {msg && <div className={`alert alert-${msg.tipo} py-2`}>{msg.texto}</div>}

        <div className="lf-card p-3 mb-4">
          {editando ? (
            <form onSubmit={salvarTime} className="d-flex gap-3 align-items-center flex-wrap">
              <TeamLogo name={nome || '?'} logoUrl={logo === undefined ? team.logoUrl : logo} size={64} />
              <div className="flex-grow-1">
                <input className="form-control mb-2" required value={nome} onChange={(e) => setNome(e.target.value)} />
                <input
                  className="form-control form-control-sm"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => e.target.files?.[0] && setLogo(await resizeImage(e.target.files[0]))}
                />
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-light" onClick={() => setEditando(false)}>Cancelar</button>
                <button className="btn btn-lf">Salvar</button>
              </div>
            </form>
          ) : (
            <div className="d-flex gap-3 align-items-center flex-wrap">
              <TeamLogo name={team.name} logoUrl={team.logoUrl} size={64} />
              <h3 className="fw-bold mb-0 flex-grow-1">{team.name}</h3>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-light" onClick={abrirEdicao}><i className="bi bi-pencil me-1" />Editar</button>
                <button className="btn btn-sm btn-outline-danger" onClick={excluirTime}><i className="bi bi-trash me-1" />Excluir</button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={adicionar} className="lf-card p-3 mb-4">
          <h5 className="fw-bold mb-3">Adicionar jogador</h5>
          <div className="btn-group mb-3">
            <button type="button" className={`btn btn-sm ${modo === 'email' ? 'btn-lf' : 'btn-outline-light'}`} onClick={() => setModo('email')}>
              Por e-mail
            </button>
            <button type="button" className={`btn btn-sm ${modo === 'manual' ? 'btn-lf' : 'btn-outline-light'}`} onClick={() => setModo('manual')}>
              Manual
            </button>
          </div>
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              {modo === 'email' ? (
                <input className="form-control" type="email" placeholder="E-mail cadastrado do jogador" required value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
              ) : (
                <input className="form-control" placeholder="Nome do jogador" required value={novo.name} onChange={(e) => setNovo({ ...novo, name: e.target.value })} />
              )}
            </div>
            <div className="col-4 col-md-2">
              <input className="form-control" type="number" min={0} max={99} placeholder="Nº" value={novo.number} onChange={(e) => setNovo({ ...novo, number: e.target.value })} />
            </div>
            <div className="col-8 col-md-2">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="cap" checked={novo.isCaptain} onChange={(e) => setNovo({ ...novo, isCaptain: e.target.checked })} />
                <label className="form-check-label" htmlFor="cap">Capitão</label>
              </div>
            </div>
            <div className="col-12 col-md-2">
              <button className="btn btn-lf w-100">Adicionar</button>
            </div>
          </div>
        </form>

        <h5 className="fw-bold mb-3">Elenco ({team.players.length})</h5>
        {team.players.length === 0 ? (
          <p style={{ color: 'var(--lf-muted)' }}>Nenhum jogador ainda.</p>
        ) : (
          <div className="table-responsive lf-card">
            <table className="table table-dark table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Nº</th>
                  <th>Jogador</th>
                  <th className="text-center" style={{ width: 90 }}>Capitão</th>
                  <th style={{ width: 60 }} />
                </tr>
              </thead>
              <tbody>
                {team.players.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        key={`${p.id}-${p.number}`}
                        className="form-control form-control-sm"
                        type="number"
                        min={0}
                        max={99}
                        defaultValue={p.number ?? ''}
                        onBlur={(e) => salvarNumero(p, e.target.value)}
                      />
                    </td>
                    <td>
                      {p.name}
                      <br />
                      <small style={{ color: 'var(--lf-muted)' }}>{p.user ? p.user.email : 'Adicionado manualmente'}</small>
                    </td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-link" title="Capitão" onClick={() => alternarCapitao(p)}>
                        <i className={`bi ${p.isCaptain ? 'bi-star-fill text-warning' : 'bi-star'} fs-5`} />
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger" title="Remover" onClick={() => remover(p)}>
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}