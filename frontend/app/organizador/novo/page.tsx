'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api, errorMessage } from '@/lib/api';
import { DESEMPATES, FORMATOS, MODALIDADES, Desempate, Formato, Modalidade } from '@/lib/labels';
import { useUser } from '@/lib/useUser';

export default function NovoCampeonato() {
  useUser();
  const router = useRouter();
  const [name, setName] = useState('');
  const [modality, setModality] = useState<Modalidade>('FUTSAL');
  const [format, setFormat] = useState<Formato>('PONTOS_CORRIDOS');
  const [slots, setSlots] = useState(8);
  const [homeAndAway, setHomeAndAway] = useState(false);
  const [groupsCount, setGroupsCount] = useState(2);
  const [qualifiers, setQualifiers] = useState(2);
  const [criterios, setCriterios] = useState(
    (Object.keys(DESEMPATES) as Desempate[]).map((key) => ({ key, ativo: true })),
  );
  const [yellowLimit, setYellowLimit] = useState(3);
  const [redSuspension, setRedSuspension] = useState(1);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const temTabela = format !== 'MATA_MATA';
  const porGrupo = Math.floor(slots / Math.max(groupsCount, 1));

  function mover(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= criterios.length) return;
    const lista = [...criterios];
    [lista[i], lista[j]] = [lista[j], lista[i]];
    setCriterios(lista);
  }

  async function criar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const { data } = await api.post('/tournaments', {
        name,
        modality,
        format,
        slots,
        homeAndAway,
        groupsCount: format === 'GRUPOS_MATA_MATA' ? groupsCount : null,
        qualifiersPerGroup: format === 'GRUPOS_MATA_MATA' ? qualifiers : null,
        tiebreakers: temTabela ? criterios.filter((c) => c.ativo).map((c) => c.key) : [],
        yellowLimit,
        redSuspension,
      });
      router.push(`/organizador/campeonatos/${data.id}`);
    } catch (err) {
      setErro(errorMessage(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSalvando(false);
    }
  }

  const textoIdaVolta =
    format === 'PONTOS_CORRIDOS' ? 'Turno e returno (cada dupla joga 2 vezes)' : 'Jogos de ida e volta no mata-mata';

  return (
    <>
      <Navbar />
      <main className="container py-4" style={{ maxWidth: 720 }}>
        <Link href="/organizador" className="btn btn-sm btn-outline-light mb-3">
          <i className="bi bi-arrow-left me-1" />Meus campeonatos
        </Link>
        <h3 className="fw-bold mb-3">Novo campeonato</h3>
        {erro && <div className="alert alert-danger py-2">{erro}</div>}

        <form onSubmit={criar}>
          <div className="lf-card p-3 mb-3">
            <h5 className="fw-bold mb-3">Informações</h5>
            <label className="form-label">Nome</label>
            <input className="form-control mb-3" required value={name} onChange={(e) => setName(e.target.value)} />
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Modalidade</label>
                <select className="form-select" value={modality} onChange={(e) => setModality(e.target.value as Modalidade)}>
                  {Object.entries(MODALIDADES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Número de vagas (times)</label>
                <input className="form-control" type="number" min={2} max={64} required value={slots} onChange={(e) => setSlots(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="lf-card p-3 mb-3">
            <h5 className="fw-bold mb-3">Formato</h5>
            {Object.entries(FORMATOS).map(([k, v]) => (
              <div className="form-check" key={k}>
                <input className="form-check-input" type="radio" name="format" id={k} checked={format === k} onChange={() => setFormat(k as Formato)} />
                <label className="form-check-label" htmlFor={k}>{v}</label>
              </div>
            ))}

            {format === 'GRUPOS_MATA_MATA' && (
              <div className="row g-3 mt-1">
                <div className="col-6">
                  <label className="form-label">Quantidade de grupos</label>
                  <input className="form-control" type="number" min={2} value={groupsCount} onChange={(e) => setGroupsCount(Number(e.target.value))} />
                </div>
                <div className="col-6">
                  <label className="form-label">Classificados por grupo</label>
                  <input className="form-control" type="number" min={1} value={qualifiers} onChange={(e) => setQualifiers(Number(e.target.value))} />
                </div>
                <small style={{ color: 'var(--lf-muted)' }}>
                  {groupsCount} grupos de cerca de {porGrupo} times; {groupsCount * qualifiers} times avançam para o mata-mata.
                </small>
              </div>
            )}

            <div className="form-check form-switch mt-3">
              <input className="form-check-input" type="checkbox" id="idaVolta" checked={homeAndAway} onChange={(e) => setHomeAndAway(e.target.checked)} />
              <label className="form-check-label" htmlFor="idaVolta">{textoIdaVolta}</label>
            </div>
          </div>

          {temTabela && (
            <div className="lf-card p-3 mb-3">
              <h5 className="fw-bold mb-1">Critérios de desempate</h5>
              <small className="d-block mb-3" style={{ color: 'var(--lf-muted)' }}>
                Aplicados nesta ordem quando dois times empatam em pontos. Desmarque os que não quiser usar.
              </small>
              <ul className="list-group">
                {criterios.map((c, i) => (
                  <li key={c.key} className="list-group-item d-flex align-items-center gap-2">
                    <input
                      className="form-check-input m-0"
                      type="checkbox"
                      checked={c.ativo}
                      onChange={(e) => setCriterios(criterios.map((x) => (x.key === c.key ? { ...x, ativo: e.target.checked } : x)))}
                    />
                    <span className={`flex-grow-1 ${c.ativo ? '' : 'text-decoration-line-through opacity-50'}`}>
                      {i + 1}. {DESEMPATES[c.key]}
                    </span>
                    <button type="button" className="btn btn-sm btn-outline-light" onClick={() => mover(i, -1)} disabled={i === 0}>
                      <i className="bi bi-arrow-up" />
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-light" onClick={() => mover(i, 1)} disabled={i === criterios.length - 1}>
                      <i className="bi bi-arrow-down" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="lf-card p-3 mb-4">
            <h5 className="fw-bold mb-3">Suspensões</h5>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label">Amarelos para 1 jogo de suspensão</label>
                <input className="form-control" type="number" min={1} max={10} value={yellowLimit} onChange={(e) => setYellowLimit(Number(e.target.value))} />
              </div>
              <div className="col-6">
                <label className="form-label">Jogos de suspensão por vermelho</label>
                <input className="form-control" type="number" min={1} max={5} value={redSuspension} onChange={(e) => setRedSuspension(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <button className="btn btn-lf w-100" disabled={salvando}>{salvando ? 'Criando...' : 'Criar campeonato'}</button>
        </form>
      </main>
    </>
  );
}