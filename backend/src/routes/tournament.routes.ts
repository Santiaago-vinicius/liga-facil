import { Router } from 'express';
import * as c from '../controllers/tournament.controller';
import { auth, requireProfile } from '../middlewares/auth';

const org = [auth, requireProfile('isOrganizer')];
const player = [auth, requireProfile('isPlayer')];

export const tournamentRoutes = Router();

tournamentRoutes.post('/tournaments', ...org, c.create);
tournamentRoutes.get('/tournaments/mine', ...org, c.listMine);
tournamentRoutes.get('/tournaments/open', ...player, c.listOpen);
tournamentRoutes.get('/tournaments/:id', auth, c.get);
tournamentRoutes.put('/tournaments/:id', ...org, c.update);
tournamentRoutes.delete('/tournaments/:id', ...org, c.remove);

tournamentRoutes.post('/tournaments/:id/enrollments', ...player, c.requestEnrollment);
tournamentRoutes.patch('/tournaments/:id/enrollments/:enrollmentId', ...org, c.decide);
tournamentRoutes.delete('/tournaments/:id/enrollments/:enrollmentId', auth, c.removeEnrollment);