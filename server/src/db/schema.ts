import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
});

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: text('owner_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const projectMembers = pgTable('project_members', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role').notNull().default('editor'),
});

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  tags: text('tags').notNull().default('[]'),
  ownerId: text('owner_id').references(() => users.id),
  memberIds: text('member_ids').notNull().default('[]'),
  startDate: text('start_date'),
  dueDate: text('due_date'),
  etaDate: text('eta_date'),
  priority: text('priority').notNull().default('medium'),
  status: text('status').notNull().default('todo'),
  isLocked: boolean('is_locked').notNull().default(false),
  row: integer('row').notNull().default(0),
  color: text('color'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});
