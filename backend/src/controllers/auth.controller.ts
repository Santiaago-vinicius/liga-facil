import { Request, Response } from 'express';
import { z } from 'zod';
import * as service from '../services/auth.service';

const name = z.string().trim().min(2, 'Nome muito curto');
const email = z.string().trim().toLowerCase().email('E-mail inválido');
const phone = z
  .string()
  .transform((p) => p.replace(/\D/g, ''))
  .refine((p) => p.length >= 10 && p.length <= 11, 'Telefone inválido');
const password = z.string().min(6, 'A senha precisa de pelo menos 6 caracteres');

const registerSchema = z
  .object({ name, email, phone, password, isPlayer: z.boolean(), isOrganizer: z.boolean() })
  .refine((d) => d.isPlayer || d.isOrganizer, { message: 'Escolha pelo menos um perfil' });

const loginSchema = z.object({ email, password: z.string().min(1, 'Informe a senha') });

const updateSchema = z.object({
  name: name.optional(),
  email: email.optional(),
  phone: phone.optional(),
  password: password.optional(),
  isPlayer: z.boolean().optional(),
  isOrganizer: z.boolean().optional(),
});

export async function register(req: Request, res: Response) {
  res.status(201).json(await service.register(registerSchema.parse(req.body)));
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  res.json(await service.login(email, password));
}

export async function getMe(_req: Request, res: Response) {
  res.json(await service.getMe(res.locals.userId));
}

export async function updateMe(req: Request, res: Response) {
  res.json(await service.updateMe(res.locals.userId, updateSchema.parse(req.body)));
}

export async function forgotPassword(req: Request, res: Response) {
  const data = z.object({ email }).parse(req.body);
  await service.forgotPassword(data.email);
  res.json({ message: 'Se o e-mail estiver cadastrado, você receberá um código.' });
}

export async function resetPassword(req: Request, res: Response) {
  const data = z
    .object({ email, code: z.string().regex(/^\d{6}$/, 'O código tem 6 números'), password })
    .parse(req.body);
  await service.resetPassword(data.email, data.code, data.password);
  res.json({ message: 'Senha alterada! Faça login com a nova senha.' });
}