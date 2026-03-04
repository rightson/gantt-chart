import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { signToken, authMiddleware } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = db.select().from(schema.users).where(eq(schema.users.email, body.email)).get();
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const id = uuid();
    const passwordHash = await bcrypt.hash(body.password, 10);
    const now = new Date().toISOString();

    db.insert(schema.users).values({
      id,
      email: body.email,
      name: body.name,
      passwordHash,
      createdAt: now,
    }).run();

    const token = signToken({ userId: id, email: body.email });
    res.json({ token, user: { id, email: body.email, name: body.name, createdAt: now } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = db.select().from(schema.users).where(eq(schema.users.email, body.email)).get();
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.select().from(schema.users).where(eq(schema.users.id, req.user!.userId)).get();
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt });
});

export default router;
