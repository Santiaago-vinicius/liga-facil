export const MODALIDADES = {
  FUTSAL: 'Futsal',
  FUT7: 'Fut7',
  FUT11: 'Futebol 11',
  AREIA: 'Futebol de areia',
} as const;

export const FORMATOS = {
  PONTOS_CORRIDOS: 'Pontos corridos',
  MATA_MATA: 'Mata-mata',
  GRUPOS_MATA_MATA: 'Grupos + mata-mata',
} as const;

export const DESEMPATES = {
  VITORIAS: 'Número de vitórias',
  SALDO: 'Saldo de gols',
  GOLS_PRO: 'Gols marcados',
  CONFRONTO: 'Confronto direto',
  MENOS_CARTOES: 'Menos cartões',
} as const;

export const STATUS_INSCRICAO = {
  PENDENTE: { texto: 'Pendente', cor: 'warning' },
  ACEITA: { texto: 'Aceita', cor: 'success' },
  RECUSADA: { texto: 'Recusada', cor: 'danger' },
} as const;

export type Modalidade = keyof typeof MODALIDADES;
export type Formato = keyof typeof FORMATOS;
export type Desempate = keyof typeof DESEMPATES;