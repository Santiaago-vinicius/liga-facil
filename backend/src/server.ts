import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 3333;
app.listen(port, () => console.log(`API em http://localhost:${port}`));