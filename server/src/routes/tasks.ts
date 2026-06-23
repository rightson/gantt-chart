import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { authHook } from '../middleware/auth.js';

function serializeTask(task: any) {
  return {
    ...task,
    tags: JSON.parse(task.tags || '[]'),
    memberIds: JSON.parse(task.memberIds || '[]'),
    isLocked: Boolean(task.isLocked),
  };
}

export default async function taskRoutes(app: FastifyInstance) {
  app.addHook('onRequest', authHook);

  app.get('/project/:projectId', async (request) => {
    const { projectId } = request.params as any;
    const tasks = await db.select().from(schema.tasks)
      .where(and(eq(schema.tasks.projectId, projectId), isNull(schema.tasks.deletedAt)));
    return tasks.map(serializeTask);
  });

  // Get deleted (trashed) tasks for a project
  app.get('/project/:projectId/trash', async (request) => {
    const { projectId } = request.params as any;
    const tasks = await db.select().from(schema.tasks)
      .where(and(eq(schema.tasks.projectId, projectId), isNotNull(schema.tasks.deletedAt)));
    return tasks.map(serializeTask);
  });

  // Restore a deleted task
  app.post('/:id/restore', async (request, reply) => {
    const { id } = request.params as any;
    const [existing] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    if (!existing) {
      return reply.code(404).send({ error: 'Task not found' });
    }
    if (!existing.deletedAt) {
      return reply.code(400).send({ error: 'Task is not deleted' });
    }
    await db.update(schema.tasks).set({ deletedAt: null, updatedAt: new Date().toISOString() }).where(eq(schema.tasks.id, id));
    const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    return serializeTask(task);
  });

  app.post('/', async (request, reply) => {
    const {
      projectId, title, description, category, tags, ownerId,
      memberIds, startDate, dueDate, etaDate, priority, row, color,
    } = request.body as any;

    const id = uuid();
    const now = new Date().toISOString();

    await db.insert(schema.tasks).values({
      id,
      projectId,
      title: title || 'Untitled Task',
      description,
      category,
      tags: JSON.stringify(tags || []),
      ownerId: ownerId || request.user!.userId,
      memberIds: JSON.stringify(memberIds || []),
      startDate,
      dueDate,
      etaDate,
      priority: priority || 'medium',
      row: row ?? 0,
      color,
      createdAt: now,
      updatedAt: now,
    });

    const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    reply.code(201);
    return serializeTask(task);
  });

  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const [existing] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    if (!existing) {
      return reply.code(404).send({ error: 'Task not found' });
    }
    if (existing.isLocked) {
      return reply.code(403).send({ error: 'Task is locked' });
    }

    const body = request.body as any;
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    const allowed = [
      'title', 'description', 'category', 'ownerId',
      'startDate', 'dueDate', 'etaDate', 'priority', 'status', 'row', 'color',
    ];

    for (const key of allowed) {
      if (body[key] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates[dbKey] = body[key];
      }
    }

    if (body.tags !== undefined) {
      updates.tags = JSON.stringify(body.tags);
    }
    if (body.memberIds !== undefined) {
      updates.member_ids = JSON.stringify(body.memberIds);
    }
    if (body.isLocked !== undefined) {
      updates.is_locked = body.isLocked;
    }

    await db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, id));

    const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    return serializeTask(task);
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as any;
    const [existing] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    if (!existing) {
      return reply.code(404).send({ error: 'Task not found' });
    }
    const deletedAt = new Date().toISOString();
    await db.update(schema.tasks).set({ deletedAt, updatedAt: deletedAt }).where(eq(schema.tasks.id, id));
    return { message: 'Task moved to trash', deletedAt };
  });

  // Permanently delete a task from trash
  app.delete('/:id/permanent', async (request, reply) => {
    const { id } = request.params as any;
    const [existing] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
    if (!existing) {
      return reply.code(404).send({ error: 'Task not found' });
    }
    await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
    return { message: 'Task permanently deleted' };
  });
}
