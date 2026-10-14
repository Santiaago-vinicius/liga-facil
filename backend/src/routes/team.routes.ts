import { Router } from 'express';
import * as c from '../controllers/team.controller';
import { auth, requireProfile } from '../middlewares/auth';

export const teamRoutes = Router();
teamRoutes.use('/teams', auth, requireProfile('isPlayer'));

teamRoutes.get('/teams', c.list);
teamRoutes.post('/teams', c.create);
teamRoutes.get('/teams/:id', c.get);
teamRoutes.put('/teams/:id', c.update);
teamRoutes.delete('/teams/:id', c.remove);
teamRoutes.post('/teams/:id/players', c.addPlayer);
teamRoutes.put('/teams/:id/players/:playerId', c.updatePlayer);
teamRoutes.delete('/teams/:id/players/:playerId', c.removePlayer);