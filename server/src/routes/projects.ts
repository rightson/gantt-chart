import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { eq, or } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { authHook } from '../middleware/auth.js';

export default async function projectRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authHook);

  app.get('/', async (request) => {
    const userId = request.user!.userId;
    const owned = db.select().from(schema.projects).where(eq(schema.projects.ownerId, userId)).all();
    const memberships = db.select().from(schema.projectMembers).where(eq(schema.projectMembers.userId, userId)).all();
    const memberProjectIds = memberships.map(m => m.projectId);

    const memberProjects = memberProjectIds.length > 0
      ? db.select().from(schema.projects).where(
          or(...memberProjectIds.map(pid => eq(schema.projects.id, pid)))!
        ).all()
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

    db.insert(schema.projects).values({
      id,
      name: name || 'Untitled Project',
      description,
      ownerId: request.user!.userId,
      createdAt: now,
      updatedAt: now,
    }).run();

    db.insert(schema.projectMembers).values({
      id: uuid(),
      projectId: id,
      userId: request.user!.userId,
      role: 'owner',
    }).run();

    const project = db.select().from(schema.projects).where(eq(schema.projects.id, id)).get();
    reply.code(201);
    return project;
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const project = db.select().from(schema.projects).where(eq(schema.projects.id, id)).get();
    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }
    return project;
  });

  app.get('/:id/members', async (request) => {
    const { id } = request.params as any;
    const members = db.select({
      id: schema.projectMembers.id,
      userId: schema.projectMembers.userId,
      role: schema.projectMembers.role,
      userName: schema.users.name,
      userEmail: schema.users.email,
    })
      .from(schema.projectMembers)
      .innerJoin(schema.users, eq(schema.projectMembers.userId, schema.users.id))
      .where(eq(schema.projectMembers.projectId, id))
      .all();

    return members;
  });

  app.post('/:id/members', async (request, reply) => {
    const { id } = request.params as any;
    const { email, role } = request.body as any;
    const user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const existing = db.select().from(schema.projectMembers)
      .where(eq(schema.projectMembers.projectId, id))
      .all()
      .find(m => m.userId === user.id);

    if (existing) {
      return reply.code(409).send({ error: 'User already a member' });
    }

    db.insert(schema.projectMembers).values({
      id: uuid(),
      projectId: id,
      userId: user.id,
      role: role || 'editor',
    }).run();

    reply.code(201);
    return { message: 'Member added' };
  });
}
