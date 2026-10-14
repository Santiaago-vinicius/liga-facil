import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { authRoutes } from './routes/auth.routes';
import { AppError } from './lib/errors';
import { teamRoutes } from './routes/team.routes';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(authRoutes);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) return res.status(400).json({ message: err.issues[0].message });
  if (err instanceof AppError) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Erro interno no servidor' });
};
app.use(errorHandler);

const port = Number(process.env.PORT) || 3333;
app.listen(port, () => console.log(`API em http://localhost:${port}`));

app.use(authRoutes);
app.use(teamRoutes);