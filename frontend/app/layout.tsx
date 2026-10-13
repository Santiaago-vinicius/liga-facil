import type { Metadata } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'LigaFácil',
  description: 'Gerenciamento de campeonatos amadores',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-bs-theme="dark">
      <body>{children}</body>
    </html>
  );
}