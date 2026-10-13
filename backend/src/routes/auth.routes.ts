import { Router } from 'express';
import * as c from '../controllers/auth.controller';
import { auth } from '../middlewares/auth';

export const authRoutes = Router();
authRoutes.post('/auth/register', c.register);
authRoutes.post('/auth/login', c.login);
authRoutes.get('/users/me', auth, c.getMe);
authRoutes.put('/users/me', auth, c.updateMe);
authRoutes.post('/auth/forgot-password', c.forgotPassword);
authRoutes.post('/auth/reset-password', c.resetPassword);