import { Hono } from 'hono';
import dotenv from 'dotenv';

dotenv.config();

const app = new Hono();

app.get('/health', (c) => {
  return c.json({ ok: true, message: 'Family tutor backend is running' });
});

export default app;
