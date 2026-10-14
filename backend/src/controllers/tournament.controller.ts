import { Request, Response } from 'express';
import { z } from 'zod';
import * as service from '../services/tournament.service';

type Req = Request<{ id: string; enrollmentId: string }>;
const uid = (res: Response) => res.locals.userId as string;

const tournamentSchema = z.object({
  name: z.string().trim().min(3, 'Nome muito curto').max(60, 'Nome muito longo'),
  modality: z.enum(['FUTSAL', 'FUT7', 'FUT11', 'AREIA'], { message: 'Modalidade inválida' }),
  format: z.enum(['PONTOS_CORRIDOS', 'MATA_MATA', 'GRUPOS_MATA_MATA'], { message: 'Formato inválido' }),
  slots: z.number().int().min(2, 'Mínimo de 2 vagas').max(64, 'Máximo de 64 vagas'),
  homeAndAway: z.boolean(),
  groupsCount: z.number().int().nullable().optional(),
  qualifiersPerGroup: z.number().int().nullable().optional(),
  tiebreakers: z
    .array(z.enum(service.TIEBREAKERS))
    .refine((a) => new Set(a).size === a.length, 'Critério de desempate repetido'),
  yellowLimit: z.number().int().min(1, 'Mínimo de 1 amarelo').max(10, 'Máximo de 10 amarelos'),
  redSuspension: z.number().int().min(1, 'Mínimo de 1 jogo').max(5, 'Máximo de 5 jogos'),
});

export async function create(req: Req, res: Response) {
  res.status(201).json(await service.createTournament(uid(res), tournamentSchema.parse(req.body)));
}

export async function listMine(_req: Req, res: Response) {
  res.json(await service.listMine(uid(res)));
}

export async function listOpen(_req: Req, res: Response) {
  res.json(await service.listOpen(uid(res)));
}

export async function get(req: Req, res: Response) {
  res.json(await service.getTournament(req.params.id, uid(res)));
}

export async function update(req: Req, res: Response) {
  res.json(await service.updateTournament(req.params.id, uid(res), tournamentSchema.partial().parse(req.body)));
}

export async function remove(req: Req, res: Response) {
  await service.deleteTournament(req.params.id, uid(res));
  res.status(204).end();
}

export async function requestEnrollment(req: Req, res: Response) {
  const { teamId } = z.object({ teamId: z.string().min(1, 'Escolha um time') }).parse(req.body);
  res.status(201).json(await service.requestEnrollment(req.params.id, teamId, uid(res)));
}

export async function decide(req: Req, res: Response) {
  const { status } = z.object({ status: z.enum(['ACEITA', 'RECUSADA']) }).parse(req.body);
  res.json(await service.decideEnrollment(req.params.id, req.params.enrollmentId, uid(res), status));
}

export async function removeEnrollment(req: Req, res: Response) {
  await service.removeEnrollment(req.params.id, req.params.enrollmentId, uid(res));
  res.status(204).end();
}