import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { eq, or } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const userId = req.user!.userId;
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

  res.json(allProjects);
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  const id = uuid();
  const now = new Date().toISOString();

  db.insert(schema.projects).values({
    id,
    name: name || 'Untitled Project',
    description,
    ownerId: req.user!.userId,
    createdAt: now,
    updatedAt: now,
  }).run();

  db.insert(schema.projectMembers).values({
    id: uuid(),
    projectId: id,
    userId: req.user!.userId,
    role: 'owner',
  }).run();

  const project = db.select().from(schema.projects).where(eq(schema.projects.id, id)).get();
  res.status(201).json(project);
});

router.get('/:id', (req, res) => {
  const project = db.select().from(schema.projects).where(eq(schema.projects.id, req.params.id)).get();
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json(project);
});

router.get('/:id/members', (req, res) => {
  const members = db.select({
    id: schema.projectMembers.id,
    userId: schema.projectMembers.userId,
    role: schema.projectMembers.role,
    userName: schema.users.name,
    userEmail: schema.users.email,
  })
    .from(schema.projectMembers)
    .innerJoin(schema.users, eq(schema.projectMembers.userId, schema.users.id))
    .where(eq(schema.projectMembers.projectId, req.params.id))
    .all();

  res.json(members);
});

router.post('/:id/members', (req, res) => {
  const { email, role } = req.body;
  const user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const existing = db.select().from(schema.projectMembers)
    .where(eq(schema.projectMembers.projectId, req.params.id))
    .all()
    .find(m => m.userId === user.id);

  if (existing) {
    res.status(409).json({ error: 'User already a member' });
    return;
  }

  db.insert(schema.projectMembers).values({
    id: uuid(),
    projectId: req.params.id,
    userId: user.id,
    role: role || 'editor',
  }).run();

  res.status(201).json({ message: 'Member added' });
});

export default router;
