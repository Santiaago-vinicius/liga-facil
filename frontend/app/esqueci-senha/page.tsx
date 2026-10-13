'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api, errorMessage } from '@/lib/api';

export default function EsqueciSenha() {
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function pedirCodigo(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMsg({ tipo: 'success', texto: data.message });
      setEtapa(2);
    } catch (err) {
      setMsg({ tipo: 'danger', texto: errorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  async function redefinir(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setMsg({ tipo: 'danger', texto: 'As senhas não conferem' });
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email, code, password });
      setMsg({ tipo: 'success', texto: data.message });
      setEtapa(3);
    } catch (err) {
      setMsg({ tipo: 'danger', texto: errorMessage(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container d-flex justify-content-center align-items-center min-vh-100 py-4">
      <div className="lf-card p-4 w-100" style={{ maxWidth: 420 }}>
        <h2 className="fw-bold mb-2 text-center">Recuperar senha</h2>
        {msg && <div className={`alert alert-${msg.tipo} py-2 mt-3`}>{msg.texto}</div>}

        {etapa === 1 && (
          <form onSubmit={pedirCodigo}>
            <p className="text-center mb-4" style={{ color: 'var(--lf-muted)' }}>
              Informe seu e-mail para receber um código de 6 números.
            </p>
            <input className="form-control mb-3" type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn btn-lf w-100" disabled={loading}>{loading ? 'Enviando...' : 'Enviar código'}</button>
          </form>
        )}

        {etapa === 2 && (
          <form onSubmit={redefinir}>
            <input
              className="form-control mb-3 text-center fs-4"
              style={{ letterSpacing: 8 }}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <input className="form-control mb-3" type="password" placeholder="Nova senha (mín. 6)" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            <input className="form-control mb-3" type="password" placeholder="Confirme a nova senha" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <button className="btn btn-lf w-100 mb-2" disabled={loading}>{loading ? 'Salvando...' : 'Redefinir senha'}</button>
            <button type="button" className="btn btn-link w-100" onClick={() => pedirCodigo()} disabled={loading}>
              Reenviar código
            </button>
          </form>
        )}

        {etapa === 3 && <Link href="/login" className="btn btn-lf w-100">Ir para o login</Link>}

        {etapa !== 3 && (
          <p className="text-center mt-3 mb-0"><Link href="/login">Voltar ao login</Link></p>
        )}
      </div>
    </main>
  );
}