import axios from 'axios';
import type { Desempate, Formato, Modalidade } from './labels';

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
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Não foi possível conectar ao servidor';
    const data = err.response.data;
    if (data && typeof data === 'object' && 'message' in data) return String(data.message);
    return `Erro ${err.response.status} ao processar a solicitação`;
  }
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

export type EnrollmentStatus = 'PENDENTE' | 'ACEITA' | 'RECUSADA';

export type Tournament = {
  id: string;
  name: string;
  modality: Modalidade;
  format: Formato;
  slots: number;
  homeAndAway: boolean;
  groupsCount: number | null;
  qualifiersPerGroup: number | null;
  tiebreakers: Desempate[];
  yellowLimit: number;
  redSuspension: number;
  status: 'INSCRICOES' | 'EM_ANDAMENTO' | 'FINALIZADO';
  organizerId: string;
  organizer?: { name: string };
};

export type Enrollment = {
  id: string;
  status: EnrollmentStatus;
  team: { id: string; name: string; logoUrl: string | null; ownerId: string; owner: { name: string } };
};

export type TournamentDetail = Tournament & { enrollments: Enrollment[]; isOrganizer: boolean };
export type MyTournament = Tournament & { enrollments: { status: EnrollmentStatus }[] };
export type OpenTournament = Tournament & {
  accepted: number;
  myEnrollments: { id: string; teamId: string; status: EnrollmentStatus }[];
};