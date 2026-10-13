'use client';
import { FormEvent, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { api, errorMessage } from '@/lib/api';
import { useUser } from '@/lib/useUser';
import Link from 'next/link';

export default function Perfil() {
  const { user, mutate } = useUser();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', isPlayer: false, isOrganizer: false });
  const [msg, setMsg] = useState<{ tipo: 'success' | 'danger'; texto: string } | null>(null);

  useEffect(() => {
    if (user) setForm({ ...user, password: '' });
  }, [user]);

  const set = (campo: string, valor: string | boolean) => setForm((f) => ({ ...f, [campo]: valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const { password, ...resto } = form;
    try {
      const { data } = await api.put('/users/me', password ? form : resto);
      mutate(data, false);
      setForm((f) => ({ ...f, password: '' }));
      setMsg({ tipo: 'success', texto: 'Perfil atualizado!' });
    } catch (err) {
      setMsg({ tipo: 'danger', texto: errorMessage(err) });
    }
  }

  if (!user) return <div className="text-center mt-5"><div className="spinner-border text-success" /></div>;

  return (
    <>
      <Navbar />
      <main className="container py-5 d-flex justify-content-center">
        <form onSubmit={salvar} className="lf-card p-4 w-100" style={{ maxWidth: 480 }}>
          <h3 className="fw-bold mb-4">Editar perfil</h3>
          {msg && <div className={`alert alert-${msg.tipo} py-2`}>{msg.texto}</div>}

          <label className="form-label">Nome</label>
          <input className="form-control mb-3" required value={form.name} onChange={(e) => set('name', e.target.value)} />
          <label className="form-label">E-mail</label>
          <input className="form-control mb-3" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
          <label className="form-label">Telefone</label>
          <input className="form-control mb-3" type="tel" required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <label className="form-label">Nova senha (deixe vazio para manter)</label>
          <input className="form-control mb-3" type="password" minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} />

          <div className="form-check mb-1">
            <input className="form-check-input" type="checkbox" id="p" checked={form.isPlayer} onChange={(e) => set('isPlayer', e.target.checked)} />
            <label className="form-check-label" htmlFor="p">Perfil de jogador</label>
          </div>
          <div className="form-check mb-4">
            <input className="form-check-input" type="checkbox" id="o" checked={form.isOrganizer} onChange={(e) => set('isOrganizer', e.target.checked)} />
            <label className="form-check-label" htmlFor="o">Perfil de organizador</label>
          </div>

          <div className="d-flex gap-2">
            <Link href="/hub" className="btn btn-outline-light w-50">
                <i className="bi bi-arrow-left me-1" />Voltar ao hub
            </Link>
            <button className="btn btn-lf w-50">Salvar</button>
        </div>
        </form>
      </main>
    </>
  );
}