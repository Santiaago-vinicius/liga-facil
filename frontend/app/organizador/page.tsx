'use client';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/useUser';

export default function Organizador() {
  useUser();
  return (
    <>
      <Navbar />
      <main className="container py-5"><h2 className="fw-bold">Área do organizador</h2><p>Em construção — Fase 4.</p></main>
    </>
  );
}