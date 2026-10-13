'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, errorMessage, saveSession } from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
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
        <h2 className="fw-bold mb-4 text-center">Entrar</h2>
        {erro && <div className="alert alert-danger py-2">{erro}</div>}
        <input className="form-control mb-3" type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="form-control mb-2" type="password" placeholder="Senha" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="text-end mb-3">
            <Link href="/esqueci-senha" className="small">Esqueci minha senha</Link>
        </div>
        <button className="btn btn-lf w-100 mb-3" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        <p className="text-center mb-0">Não tem conta? <Link href="/cadastro">Cadastre-se</Link></p>
      </form>
    </main>
  );
}