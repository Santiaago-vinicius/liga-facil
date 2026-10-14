import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

type TeamData = { name: string; logoUrl?: string | null };
type PlayerData = { email?: string; name?: string; number?: number | null; isCaptain?: boolean };

async function ownedTeam(teamId: string, userId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new AppError(404, 'Time não encontrado');
  if (team.ownerId !== userId) throw new AppError(403, 'Você não é o dono deste time');
  return team;
}

async function checkNumber(teamId: string, number?: number | null, ignoreId?: string) {
  if (number == null) return;
  const dup = await prisma.teamPlayer.findFirst({
    where: { teamId, number, ...(ignoreId && { NOT: { id: ignoreId } }) },
  });
  if (dup) throw new AppError(409, `A camisa ${number} já é de ${dup.name}`);
}

export function listMyTeams(userId: string) {
  return prisma.team.findMany({
    where: { ownerId: userId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { players: true } } },
  });
}

export function createTeam(userId: string, data: TeamData) {
  return prisma.team.create({ data: { ...data, ownerId: userId } });
}

export async function getTeam(teamId: string, userId: string) {
  await ownedTeam(teamId, userId);
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      players: {
        orderBy: [{ isCaptain: 'desc' }, { number: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
        include: { user: { select: { email: true } } },
      },
    },
  });
}

export async function updateTeam(teamId: string, userId: string, data: Partial<TeamData>) {
  await ownedTeam(teamId, userId);
  return prisma.team.update({ where: { id: teamId }, data });
}

export async function deleteTeam(teamId: string, userId: string) {
  await ownedTeam(teamId, userId);
  const enrollments = await prisma.enrollment.count({ where: { teamId } });
  if (enrollments) throw new AppError(400, 'Este time está inscrito em campeonato e não pode ser excluído');
  await prisma.team.delete({ where: { id: teamId } });
}

export async function addPlayer(teamId: string, userId: string, data: PlayerData) {
  await ownedTeam(teamId, userId);

  let name = data.name;
  let linkedUserId: string | undefined;
  if (data.email) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError(404, 'Nenhum usuário cadastrado com esse e-mail');
    const dup = await prisma.teamPlayer.findFirst({ where: { teamId, userId: user.id } });
    if (dup) throw new AppError(409, 'Esse jogador já está no time');
    name = user.name;
    linkedUserId = user.id;
  }
  if (!name) throw new AppError(400, 'Informe o e-mail ou o nome do jogador');
  await checkNumber(teamId, data.number);

  return prisma.$transaction(async (tx) => {
    if (data.isCaptain) await tx.teamPlayer.updateMany({ where: { teamId }, data: { isCaptain: false } });
    return tx.teamPlayer.create({
      data: { teamId, userId: linkedUserId, name, number: data.number ?? null, isCaptain: data.isCaptain ?? false },
    });
  });
}

export async function updatePlayer(teamId: string, playerId: string, userId: string, data: Omit<PlayerData, 'email'>) {
  await ownedTeam(teamId, userId);
  const player = await prisma.teamPlayer.findFirst({ where: { id: playerId, teamId } });
  if (!player) throw new AppError(404, 'Jogador não encontrado');
  if (data.name && player.userId) throw new AppError(400, 'O nome de quem tem conta só é alterado no perfil dele');
  await checkNumber(teamId, data.number, playerId);

  return prisma.$transaction(async (tx) => {
    if (data.isCaptain) await tx.teamPlayer.updateMany({ where: { teamId }, data: { isCaptain: false } });
    return tx.teamPlayer.update({ where: { id: playerId }, data });
  });
}

export async function removePlayer(teamId: string, playerId: string, userId: string) {
  await ownedTeam(teamId, userId);
  const player = await prisma.teamPlayer.findFirst({ where: { id: playerId, teamId } });
  if (!player) throw new AppError(404, 'Jogador não encontrado');
  try {
    await prisma.teamPlayer.delete({ where: { id: playerId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw new AppError(400, 'Esse jogador já atuou em partidas e não pode ser removido');
    }
    throw err;
  }
}