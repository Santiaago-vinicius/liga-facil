import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { signToken } from '../lib/jwt';

export const userSelect = {
  id: true, name: true, email: true, phone: true,
  isPlayer: true, isOrganizer: true, createdAt: true,
} as const;

type RegisterData = {
  name: string; email: string; phone: string; password: string;
  isPlayer: boolean; isOrganizer: boolean;
};

async function ensureUnique(email?: string, phone?: string, ignoreId?: string) {
  if (email) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u && u.id !== ignoreId) throw new AppError(409, 'E-mail já cadastrado');
  }
  if (phone) {
    const u = await prisma.user.findUnique({ where: { phone } });
    if (u && u.id !== ignoreId) throw new AppError(409, 'Telefone já cadastrado');
  }
}

export async function register(data: RegisterData) {
  await ensureUnique(data.email, data.phone);
  const { password, ...rest } = data;
  const user = await prisma.user.create({
    data: { ...rest, passwordHash: await bcrypt.hash(password, 10) },
    select: userSelect,
  });
  return { token: signToken(user.id), user };
}

export async function login(email: string, password: string) {
  const found = await prisma.user.findUnique({ where: { email } });
  if (!found || !(await bcrypt.compare(password, found.passwordHash))) {
    throw new AppError(401, 'E-mail ou senha inválidos');
  }
  const user = await prisma.user.findUnique({ where: { id: found.id }, select: userSelect });
  return { token: signToken(found.id), user };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw new AppError(404, 'Usuário não encontrado');
  return user;
}

export async function updateMe(userId: string, data: Partial<RegisterData>) {
  const current = await getMe(userId);
  await ensureUnique(data.email, data.phone, userId);

  const isPlayer = data.isPlayer ?? current.isPlayer;
  const isOrganizer = data.isOrganizer ?? current.isOrganizer;
  if (!isPlayer && !isOrganizer) throw new AppError(400, 'Mantenha pelo menos um perfil ativo');

  const { password, ...rest } = data;
  return prisma.user.update({
    where: { id: userId },
    data: { ...rest, ...(password && { passwordHash: await bcrypt.hash(password, 10) }) },
    select: userSelect,
  });
}