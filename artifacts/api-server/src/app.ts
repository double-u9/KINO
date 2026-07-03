import express, { type Express } from 'express';

const app: Express = express();

app.get('/api/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
