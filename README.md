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

## Production Deployment

```bash
# Build all packages
npm run build

# Start the server
cd server && node dist/index.js
```

The server runs the API and WebSocket on port 3001 but does not serve the client static files. Use nginx (or a similar reverse proxy) to serve `client/dist/` and proxy backend requests:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/gantt-chart/client/dist;
    index index.html;

    # Serve client static files, fall back to index.html for client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the Node server
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy WebSocket (Socket.IO) with upgrade support
    location /socket.io {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

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