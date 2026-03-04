import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

function serializeTask(task: any) {
  return {
    ...task,
    tags: JSON.parse(task.tags || '[]'),
    memberIds: JSON.parse(task.memberIds || '[]'),
    isLocked: Boolean(task.isLocked),
  };
}

router.get('/project/:projectId', (req, res) => {
  const tasks = db.select().from(schema.tasks)
    .where(eq(schema.tasks.projectId, req.params.projectId))
    .all();
  res.json(tasks.map(serializeTask));
});

router.post('/', (req, res) => {
  const {
    projectId, title, description, category, tags, ownerId,
    memberIds, startDate, dueDate, etaDate, priority, row, color,
  } = req.body;

  const id = uuid();
  const now = new Date().toISOString();

  db.insert(schema.tasks).values({
    id,
    projectId,
    title: title || 'Untitled Task',
    description,
    category,
    tags: JSON.stringify(tags || []),
    ownerId: ownerId || req.user!.userId,
    memberIds: JSON.stringify(memberIds || []),
    startDate,
    dueDate,
    etaDate,
    priority: priority || 'medium',
    row: row ?? 0,
    color,
    createdAt: now,
    updatedAt: now,
  }).run();

  const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get();
  res.status(201).json(serializeTask(task));
});

router.patch('/:id', (req, res) => {
  const existing = db.select().from(schema.tasks).where(eq(schema.tasks.id, req.params.id)).get();
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  if (existing.isLocked) {
    res.status(403).json({ error: 'Task is locked' });
    return;
  }

  const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
  const allowed = [
    'title', 'description', 'category', 'ownerId',
    'startDate', 'dueDate', 'etaDate', 'priority', 'status', 'row', 'color',
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      // Map camelCase to snake_case for db columns
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      updates[dbKey] = req.body[key];
    }
  }

  if (req.body.tags !== undefined) {
    updates.tags = JSON.stringify(req.body.tags);
  }
  if (req.body.memberIds !== undefined) {
    updates.member_ids = JSON.stringify(req.body.memberIds);
  }
  if (req.body.isLocked !== undefined) {
    updates.is_locked = req.body.isLocked ? 1 : 0;
  }

  db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, req.params.id)).run();

  const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, req.params.id)).get();
  res.json(serializeTask(task));
});

router.delete('/:id', (req, res) => {
  const existing = db.select().from(schema.tasks).where(eq(schema.tasks.id, req.params.id)).get();
  if (!existing) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  db.delete(schema.tasks).where(eq(schema.tasks.id, req.params.id)).run();
  res.json({ message: 'Task deleted' });
});

export default router;
