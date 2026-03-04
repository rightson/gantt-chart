import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { signToken, authHook } from '../middleware/auth.js';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);

      const existing = db.select().from(schema.users).where(eq(schema.users.email, body.email)).get();
      if (existing) {
        return reply.code(409).send({ error: 'Email already registered' });
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
      return { token, user: { id, email: body.email, name: body.name, createdAt: now } };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ error: err.errors });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  app.post('/login', async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);

      const user = db.select().from(schema.users).where(eq(schema.users.email, body.email)).get();
      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(body.password, user.passwordHash);
      if (!valid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const token = signToken({ userId: user.id, email: user.email });
      return {
        token,
        user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.code(400).send({ error: err.errors });
      }
      request.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  app.get('/me', { onRequest: authHook }, async (request, reply) => {
    const user = db.select().from(schema.users).where(eq(schema.users.id, request.user!.userId)).get();
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
  });
}
