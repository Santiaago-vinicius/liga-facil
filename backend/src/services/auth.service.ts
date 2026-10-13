import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { signToken } from '../lib/jwt';
import crypto from 'crypto';
import { sendMail } from '../lib/mail';

const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

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

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash: hashToken(code),
      resetTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
      resetAttempts: 0,
    },
  });

  await sendMail(
    user.email,
    `Seu código LigaFácil: ${code}`,
    `<p>Olá, ${user.name}!</p>
     <p>Seu código para redefinir a senha é:</p>
     <h2 style="letter-spacing:6px">${code}</h2>
     <p>Ele vale por 10 minutos. Se você não pediu, ignore este e-mail.</p>`,
  );
}

export async function resetPassword(email: string, code: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.resetTokenHash || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    throw new AppError(400, 'Código inválido ou expirado. Peça um novo.');
  }
  if (user.resetAttempts >= 5) {
    throw new AppError(429, 'Muitas tentativas. Peça um novo código.');
  }
  if (hashToken(code) !== user.resetTokenHash) {
    await prisma.user.update({ where: { id: user.id }, data: { resetAttempts: { increment: 1 } } });
    throw new AppError(400, 'Código incorreto');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      resetTokenHash: null,
      resetTokenExpires: null,
      resetAttempts: 0,
    },
  });
}