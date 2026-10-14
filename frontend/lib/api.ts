import axios from 'axios';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  isPlayer: boolean;
  isOrganizer: boolean;
};

export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lf_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const saveSession = (token: string) => localStorage.setItem('lf_token', token);
export const clearSession = () => localStorage.removeItem('lf_token');

export function errorMessage(err: unknown) {
  if (axios.isAxiosError(err)) return err.response?.data?.message ?? 'Não foi possível conectar ao servidor';
  return 'Erro inesperado';
}

export const fetcher = (url: string) => api.get(url).then((r) => r.data);

export type Team = {
  id: string;
  name: string;
  logoUrl: string | null;
  _count?: { players: number };
};

export type TeamPlayer = {
  id: string;
  name: string;
  number: number | null;
  isCaptain: boolean;
  userId: string | null;
  user: { email: string } | null;
};

export type TeamDetail = Team & { players: TeamPlayer[] };