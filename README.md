# Gantt Chart

A real-time collaborative Gantt chart web application.

## Tech Stack

- **Frontend**: React 19, Vite, Zustand, TypeScript
- **Backend**: Fastify 5, Drizzle ORM, TypeScript
- **Database**: PostgreSQL
- **Real-time**: Socket.IO (WebSocket)
- **Auth**: JWT + bcryptjs

## Prerequisites

- Node.js 18+
- PostgreSQL

## Setup

```bash
# Install dependencies
npm install

# Configure environment (copy and edit as needed)
cp server/.env.example server/.env

# Run database migration
cd server && npm run db:migrate

# Start development servers (client on :5173, server on :3001)
npm run dev
```

## Environment Variables

Configure via `server/.env` (loaded automatically with dotenv):

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://localhost:5432/gantt` | PostgreSQL connection string |
| `JWT_SECRET` | `gantt-chart-secret-change-in-production` | Secret for signing JWT tokens |
| `PORT` | `3001` | Server listen port |

## Scripts

```bash
npm run dev            # Run client + server concurrently
npm run dev:client     # Client only (Vite dev server, port 5173)
npm run dev:server     # Server only (tsx watch, port 3001)
npm run build          # Production build: shared -> server -> client
```

## Project Structure

```
gantt-chart/
├── client/            # React frontend (Vite)
│   └── src/
│       ├── components/  # GanttChart, TaskCard, TaskModal, etc.
│       ├── store/       # Zustand stores (auth, project, task, chart)
│       ├── hooks/       # useSocket (WebSocket)
│       └── utils/       # API client, date/timeline math
├── server/            # Fastify backend
│   └── src/
│       ├── routes/      # auth, projects, tasks
│       ├── db/          # Drizzle schema, migration, connection
│       ├── middleware/  # JWT auth hook
│       └── ws/          # Socket.IO setup
└── shared/            # Shared TypeScript types
```

## Features

- Interactive Gantt chart with drag-to-move and edge-resize
- 9 zoom levels (half-hour to multi-year)
- Real-time collaboration via WebSocket
- Live cursor tracking
- Task locking, priorities, categories, and tags
- Project-based organization with member roles