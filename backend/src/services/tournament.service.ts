import { EnrollmentStatus, Format, Modality } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

export const TIEBREAKERS = ['VITORIAS', 'SALDO', 'GOLS_PRO', 'CONFRONTO', 'MENOS_CARTOES'] as const;

export type TournamentInput = {
  name: string;
  modality: Modality;
  format: Format;
  slots: number;
  homeAndAway: boolean;
  groupsCount?: number | null;
  qualifiersPerGroup?: number | null;
  tiebreakers: string[];
  yellowLimit: number;
  redSuspension: number;
};

const enrollmentInclude = {
  team: { select: { id: true, name: true, logoUrl: true, ownerId: true, owner: { select: { name: true } } } },
} as const;

function normalize(d: TournamentInput) {
  if (d.format !== 'MATA_MATA' && d.tiebreakers.length === 0) {
    throw new AppError(400, 'Escolha pelo menos um critério de desempate');
  }
  if (d.format === 'GRUPOS_MATA_MATA') {
    if (!d.groupsCount || d.groupsCount < 2) throw new AppError(400, 'Use pelo menos 2 grupos');
    const porGrupo = Math.floor(d.slots / d.groupsCount);
    if (porGrupo < 2) throw new AppError(400, 'Cada grupo precisa de pelo menos 2 times');
    if (!d.qualifiersPerGroup || d.qualifiersPerGroup < 1 || d.qualifiersPerGroup >= porGrupo) {
      throw new AppError(400, `Classificados por grupo: de 1 a ${porGrupo - 1}`);
    }
    return d;
  }
  return {
    ...d,
    groupsCount: null,
    qualifiersPerGroup: null,
    tiebreakers: d.format === 'MATA_MATA' ? [] : d.tiebreakers,
  };
}

async function ownedTournament(id: string, userId: string) {
  const t = await prisma.tournament.findUnique({ where: { id } });
  if (!t) throw new AppError(404, 'Campeonato não encontrado');
  if (t.organizerId !== userId) throw new AppError(403, 'Você não é o organizador deste campeonato');
  return t;
}

function acceptedCount(tournamentId: string) {
  return prisma.enrollment.count({ where: { tournamentId, status: 'ACEITA' } });
}

async function ensureNoPlayerOverlap(tournamentId: string, teamId: string, statuses: EnrollmentStatus[]) {
  const players = await prisma.teamPlayer.findMany({
    where: { teamId, userId: { not: null } },
    select: { userId: true },
  });
  const ids = players.map((p) => p.userId!);
  if (!ids.length) return;

  const clash = await prisma.teamPlayer.findFirst({
    where: {
      userId: { in: ids },
      teamId: { not: teamId },
      team: { enrollments: { some: { tournamentId, status: { in: statuses } } } },
    },
    include: { team: { select: { name: true } } },
  });
  if (clash) throw new AppError(409, `${clash.name} já está no time ${clash.team.name} neste campeonato`);
}

export function createTournament(userId: string, data: TournamentInput) {
  return prisma.tournament.create({ data: { ...normalize(data), organizerId: userId } });
}

export function listMine(userId: string) {
  return prisma.tournament.findMany({
    where: { organizerId: userId },
    orderBy: { createdAt: 'desc' },
    include: { enrollments: { select: { status: true } } },
  });
}

export async function listOpen(userId: string) {
  const list = await prisma.tournament.findMany({
    where: { status: 'INSCRICOES' },
    orderBy: { createdAt: 'desc' },
    include: {
      organizer: { select: { name: true } },
      enrollments: { select: { id: true, status: true, teamId: true, team: { select: { ownerId: true } } } },
    },
  });

  return list
    .map(({ enrollments, ...t }) => ({
      ...t,
      accepted: enrollments.filter((e) => e.status === 'ACEITA').length,
      myEnrollments: enrollments
        .filter((e) => e.team.ownerId === userId)
        .map(({ id, teamId, status }) => ({ id, teamId, status })),
    }))
    .filter((t) => t.accepted < t.slots || t.myEnrollments.length > 0);
}

export async function getTournament(id: string, userId: string) {
  const t = await prisma.tournament.findUnique({
    where: { id },
    include: {
      organizer: { select: { name: true } },
      enrollments: { include: enrollmentInclude, orderBy: { team: { name: 'asc' } } },
    },
  });
  if (!t) throw new AppError(404, 'Campeonato não encontrado');

  const isOrganizer = t.organizerId === userId;
  const enrollments = isOrganizer
    ? t.enrollments
    : t.enrollments.filter((e) => e.status === 'ACEITA' || e.team.ownerId === userId);
  return { ...t, enrollments, isOrganizer };
}

export async function updateTournament(id: string, userId: string, data: Partial<TournamentInput>) {
  const current = await ownedTournament(id, userId);
  if (current.status !== 'INSCRICOES') throw new AppError(400, 'Só é possível editar antes do início');

  const m = normalize({ ...current, ...data } as TournamentInput);
  if (m.slots < (await acceptedCount(id))) {
    throw new AppError(400, 'Já há mais times confirmados do que essa quantidade de vagas');
  }
  return prisma.tournament.update({
    where: { id },
    data: {
      name: m.name,
      modality: m.modality,
      format: m.format,
      slots: m.slots,
      homeAndAway: m.homeAndAway,
      groupsCount: m.groupsCount,
      qualifiersPerGroup: m.qualifiersPerGroup,
      tiebreakers: m.tiebreakers,
      yellowLimit: m.yellowLimit,
      redSuspension: m.redSuspension,
    },
  });
}

export async function deleteTournament(id: string, userId: string) {
  const t = await ownedTournament(id, userId);
  if (t.status !== 'INSCRICOES') throw new AppError(400, 'Campeonato já iniciado não pode ser excluído');
  await prisma.tournament.delete({ where: { id } });
}

export async function requestEnrollment(tournamentId: string, teamId: string, userId: string) {
  const t = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!t) throw new AppError(404, 'Campeonato não encontrado');
  if (t.status !== 'INSCRICOES') throw new AppError(400, 'As inscrições deste campeonato estão encerradas');

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.ownerId !== userId) throw new AppError(403, 'Você só pode inscrever times seus');

  const existing = await prisma.enrollment.findUnique({
    where: { tournamentId_teamId: { tournamentId, teamId } },
  });
  if (existing && existing.status !== 'RECUSADA') {
    throw new AppError(409, 'Este time já tem um pedido neste campeonato');
  }
  if ((await acceptedCount(tournamentId)) >= t.slots) throw new AppError(400, 'Campeonato sem vagas');

  const isOrganizer = t.organizerId === userId;
  await ensureNoPlayerOverlap(tournamentId, teamId, isOrganizer ? ['ACEITA'] : ['ACEITA', 'PENDENTE']);
  const status: EnrollmentStatus = isOrganizer ? 'ACEITA' : 'PENDENTE';

  return existing
    ? prisma.enrollment.update({ where: { id: existing.id }, data: { status } })
    : prisma.enrollment.create({ data: { tournamentId, teamId, status } });
}

export async function decideEnrollment(
  tournamentId: string,
  enrollmentId: string,
  userId: string,
  status: 'ACEITA' | 'RECUSADA',
) {
  const t = await ownedTournament(tournamentId, userId);
  if (t.status !== 'INSCRICOES') throw new AppError(400, 'As inscrições já foram encerradas');

  const e = await prisma.enrollment.findFirst({ where: { id: enrollmentId, tournamentId } });
  if (!e) throw new AppError(404, 'Inscrição não encontrada');

  if (status === 'ACEITA') {
    if ((await acceptedCount(tournamentId)) >= t.slots) throw new AppError(400, 'Todas as vagas já foram preenchidas');
    await ensureNoPlayerOverlap(tournamentId, e.teamId, ['ACEITA']);
  }
  return prisma.enrollment.update({ where: { id: enrollmentId }, data: { status } });
}

export async function removeEnrollment(tournamentId: string, enrollmentId: string, userId: string) {
  const e = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, tournamentId },
    include: { tournament: true, team: true },
  });
  if (!e) throw new AppError(404, 'Inscrição não encontrada');

  const isOrganizer = e.tournament.organizerId === userId;
  const isOwnerPending = e.team.ownerId === userId && e.status === 'PENDENTE';
  if (!isOrganizer && !isOwnerPending) throw new AppError(403, 'Você não pode cancelar esta inscrição');
  if (e.tournament.status !== 'INSCRICOES') throw new AppError(400, 'O campeonato já começou');

  await prisma.enrollment.delete({ where: { id: enrollmentId } });
}