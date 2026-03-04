import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { eq, or } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { authHook } from '../middleware/auth.js';

export default async function projectRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authHook);

  app.get('/', async (request) => {
    const userId = request.user!.userId;
    const owned = await db.select().from(schema.projects).where(eq(schema.projects.ownerId, userId));
    const memberships = await db.select().from(schema.projectMembers).where(eq(schema.projectMembers.userId, userId));
    const memberProjectIds = memberships.map(m => m.projectId);

    const memberProjects = memberProjectIds.length > 0
      ? await db.select().from(schema.projects).where(
          or(...memberProjectIds.map(pid => eq(schema.projects.id, pid)))!
        )
      : [];

    const allProjects = [...owned];
    for (const p of memberProjects) {
      if (!allProjects.find(op => op.id === p.id)) {
        allProjects.push(p);
      }
    }

    return allProjects;
  });

  app.post('/', async (request, reply) => {
    const { name, description } = request.body as any;
    const id = uuid();
    const now = new Date().toISOString();

    await db.insert(schema.projects).values({
      id,
      name: name || 'Untitled Project',
      description,
      ownerId: request.user!.userId,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(schema.projectMembers).values({
      id: uuid(),
      projectId: id,
      userId: request.user!.userId,
      role: 'owner',
    });

    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    reply.code(201);
    return project;
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }
    return project;
  });

  app.get('/:id/members', async (request) => {
    const { id } = request.params as any;
    const members = await db.select({
      id: schema.projectMembers.id,
      userId: schema.projectMembers.userId,
      role: schema.projectMembers.role,
      userName: schema.users.name,
      userEmail: schema.users.email,
    })
      .from(schema.projectMembers)
      .innerJoin(schema.users, eq(schema.projectMembers.userId, schema.users.id))
      .where(eq(schema.projectMembers.projectId, id));

    return members;
  });

  app.post('/:id/members', async (request, reply) => {
    const { id } = request.params as any;
    const { email, role } = request.body as any;
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const existingMembers = await db.select().from(schema.projectMembers)
      .where(eq(schema.projectMembers.projectId, id));
    const existing = existingMembers.find(m => m.userId === user.id);

    if (existing) {
      return reply.code(409).send({ error: 'User already a member' });
    }

    await db.insert(schema.projectMembers).values({
      id: uuid(),
      projectId: id,
      userId: user.id,
      role: role || 'editor',
    });

    reply.code(201);
    return { message: 'Member added' };
  });
}
