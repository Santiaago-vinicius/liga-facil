import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Não autenticado');
  try {
    res.locals.userId = verifyToken(header.slice(7)).sub;
  } catch {
    throw new AppError(401, 'Sessão expirada, faça login novamente');
  }
  next();
}

export function requireProfile(profile: 'isPlayer' | 'isOrganizer') {
  return async (_req: Request, res: Response, next: NextFunction) => {
    const user = await prisma.user.findUnique({ where: { id: res.locals.userId } });
    if (!user?.[profile]) throw new AppError(403, 'Seu perfil não tem acesso a esta área');
    next();
  };
}