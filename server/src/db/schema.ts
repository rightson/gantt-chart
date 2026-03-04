import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: text('owner_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const projectMembers = sqliteTable('project_members', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role', { enum: ['owner', 'editor', 'viewer'] }).notNull().default('editor'),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  tags: text('tags').notNull().default('[]'), // JSON array
  ownerId: text('owner_id').references(() => users.id),
  memberIds: text('member_ids').notNull().default('[]'), // JSON array
  startDate: text('start_date'),
  dueDate: text('due_date'),
  etaDate: text('eta_date'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] }).notNull().default('medium'),
  status: text('status', { enum: ['todo', 'in_progress', 'done'] }).notNull().default('todo'),
  isLocked: integer('is_locked', { mode: 'boolean' }).notNull().default(false),
  row: integer('row').notNull().default(0),
  color: text('color'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
