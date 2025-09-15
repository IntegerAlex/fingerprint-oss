import { Router } from 'express';
import { checkDatabaseReady } from '../storage/db';

export const healthRouter = Router();

healthRouter.get('/live', (_req, res) => {
  res.json({ status: 'ok' });
});

healthRouter.get('/ready', async (_req, res) => {
  const db = await checkDatabaseReady();
  if (!db) return res.status(503).json({ status: 'degraded', db });
  return res.json({ status: 'ready', db });
});


