import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/gantt';
const sql = postgres(connectionString);

await sql`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS project_members (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    role TEXT NOT NULL DEFAULT 'editor'
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    owner_id TEXT REFERENCES users(id),
    member_ids TEXT NOT NULL DEFAULT '[]',
    start_date TEXT,
    due_date TEXT,
    eta_date TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'todo',
    is_locked BOOLEAN NOT NULL DEFAULT false,
    row INTEGER NOT NULL DEFAULT 0,
    color TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

await sql`CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)`;
await sql`CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id)`;
await sql`CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id)`;

console.log('Database migrated successfully');
await sql.end();
