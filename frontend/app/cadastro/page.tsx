'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, errorMessage, saveSession } from '@/lib/api';

export default function Cadastro() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', isPlayer: false, isOrganizer: false });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (campo: string, valor: string | boolean) => setForm((f) => ({ ...f, [campo]: valor }));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!form.isPlayer && !form.isOrganizer) return setErro('Escolha pelo menos um perfil');
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      saveSession(data.token);
      router.push('/hub');
    } catch (err) {
      setErro(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container d-flex justify-content-center align-items-center min-vh-100 py-4">
      <form onSubmit={enviar} className="lf-card p-4 w-100" style={{ maxWidth: 420 }}>
        <h2 className="fw-bold mb-4 text-center">Criar conta</h2>
        {erro && <div className="alert alert-danger py-2">{erro}</div>}

        <input className="form-control mb-3" placeholder="Nome" required value={form.name} onChange={(e) => set('name', e.target.value)} />
        <input className="form-control mb-3" type="email" placeholder="E-mail" required value={form.email} onChange={(e) => set('email', e.target.value)} />
        <input className="form-control mb-3" type="tel" placeholder="Telefone com DDD" required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <input className="form-control mb-3" type="password" placeholder="Senha (mín. 6 caracteres)" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} />

        <p className="mb-2" style={{ color: 'var(--lf-muted)' }}>Quero usar como:</p>
        <div className="form-check mb-1">
          <input className="form-check-input" type="checkbox" id="player" checked={form.isPlayer} onChange={(e) => set('isPlayer', e.target.checked)} />
          <label className="form-check-label" htmlFor="player">Jogador</label>
        </div>
        <div className="form-check mb-4">
          <input className="form-check-input" type="checkbox" id="org" checked={form.isOrganizer} onChange={(e) => set('isOrganizer', e.target.checked)} />
          <label className="form-check-label" htmlFor="org">Organizador</label>
        </div>

        <button className="btn btn-lf w-100 mb-3" disabled={loading}>{loading ? 'Criando...' : 'Cadastrar'}</button>
        <p className="text-center mb-0">Já tem conta? <Link href="/login">Entrar</Link></p>
      </form>
    </main>
  );
}