'use client';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/useUser';

export default function Jogador() {
  useUser();
  return (
    <>
      <Navbar />
      <main className="container py-5"><h2 className="fw-bold">Área do jogador</h2><p>Em construção — Fase 3.</p></main>
    </>
  );
}