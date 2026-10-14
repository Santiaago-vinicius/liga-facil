import { Request, Response } from 'express';
import { z } from 'zod';
import * as service from '../services/team.service';

type Params = { id: string; playerId: string };
type Req = Request<Params>;

const name = z.string().trim().min(2, 'Nome muito curto').max(40, 'Nome muito longo');
const logoUrl = z
  .string()
  .startsWith('data:image/', 'Logo inválida')
  .max(400_000, 'Logo muito grande')
  .nullable()
  .optional();
const number = z.number().int().min(0, 'Número inválido').max(99, 'Use números de 0 a 99').nullable().optional();

const teamSchema = z.object({ name, logoUrl });
const addPlayerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('E-mail inválido').optional(),
    name: name.optional(),
    number,
    isCaptain: z.boolean().optional(),
  })
  .refine((d) => d.email || d.name, { message: 'Informe o e-mail ou o nome do jogador' });
const updatePlayerSchema = z.object({ name: name.optional(), number, isCaptain: z.boolean().optional() });

const uid = (res: Response) => res.locals.userId as string;

export async function list(_req: Req, res: Response) {
  res.json(await service.listMyTeams(uid(res)));
}

export async function create(req: Req, res: Response) {
  res.status(201).json(await service.createTeam(uid(res), teamSchema.parse(req.body)));
}

export async function get(req: Req, res: Response) {
  res.json(await service.getTeam(req.params.id, uid(res)));
}

export async function update(req: Req, res: Response) {
  res.json(await service.updateTeam(req.params.id, uid(res), teamSchema.partial().parse(req.body)));
}

export async function remove(req: Req, res: Response) {
  await service.deleteTeam(req.params.id, uid(res));
  res.status(204).end();
}

export async function addPlayer(req: Req, res: Response) {
  res.status(201).json(await service.addPlayer(req.params.id, uid(res), addPlayerSchema.parse(req.body)));
}

export async function updatePlayer(req: Req, res: Response) {
  res.json(await service.updatePlayer(req.params.id, req.params.playerId, uid(res), updatePlayerSchema.parse(req.body)));
}

export async function removePlayer(req: Req, res: Response) {
  await service.removePlayer(req.params.id, req.params.playerId, uid(res));
  res.status(204).end();
}