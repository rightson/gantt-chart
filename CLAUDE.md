# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm install                    # Install all workspace dependencies
npm run dev                    # Run client (port 5173) + server (port 3001) concurrently
npm run dev:client             # Client only (Vite dev server)
npm run dev:server             # Server only (tsx watch, auto-restarts)
npm run build                  # Production build: shared → server → client
cd server && npm run db:migrate  # Run database migration manually (auto-runs on server start)
```

No test runner or linter is currently configured.

## Architecture

**Monorepo** with three npm workspaces: `client/`, `server/`, `shared/`.

### Server (Fastify + TypeScript)
- **Framework**: Fastify 5 with `@fastify/cors`. Routes registered as async Fastify plugins with `app.register()` and prefix options.
- **Database**: SQLite via better-sqlite3 + Drizzle ORM. Schema in `server/src/db/schema.ts`, auto-migration in `server/src/db/migrate.ts` (runs on startup). DB file: `gantt.db`.
- **Auth**: JWT (7-day expiry, secret from `JWT_SECRET` env var). Passwords hashed with bcryptjs. Auth hook in `server/src/middleware/auth.ts` attaches `request.user` with `{ userId, email }`. Applied per-route via `onRequest` hook (not global middleware).
- **REST API**: All routes under `/api`. Auth routes (`/api/auth/*`) are public; project and task routes apply `authHook` via `addHook('onRequest', authHook)`.
- **WebSocket**: Socket.IO in `server/src/ws/index.ts`, attached to `app.server` after `app.ready()`. JWT verified on connection. Room-based: clients join `project:{id}` rooms. Handles `task:created/updated/deleted` and `cursor:move` events. Task updates are persisted to DB in the WebSocket handler.

### Client (React 19 + Vite)
- **State**: Zustand stores in `client/src/store/` — `authStore` (JWT + user), `projectStore` (project list/selection), `taskStore` (task CRUD + remote sync), `chartStore` (scroll/zoom state).
- **API calls**: `client/src/utils/api.ts` — wraps fetch with auto-auth headers. Vite proxies `/api` and `/socket.io` to `localhost:3001`.
- **Gantt canvas**: Custom implementation in `GanttChart.tsx`. Timeline math (date↔pixel conversion, zoom levels) in `client/src/utils/date.ts`. Nine zoom levels from `halfhour` to `multiyear`.
- **Task interaction**: Single-click selects, double-click opens modal (`TaskModal.tsx`). Cards are draggable (move) and edge-resizable (change start/due dates). `TaskCard.tsx` handles all drag logic.
- **WebSocket hook**: `client/src/hooks/useSocket.ts` — connects on mount, joins project room, applies remote changes via `applyRemoteUpdate/Create/Delete` on the task store.

### Shared Types
`shared/src/index.ts` defines `User`, `Project`, `TaskCard`, WebSocket event enums, and API request/response types. Referenced by both client and server.

## Key Patterns

- **Tags and memberIds** are stored as JSON strings in SQLite, parsed/serialized in the task routes.
- **Task locking**: `isLocked` flag prevents edits on completed tasks (enforced in both REST PATCH and WebSocket update handlers).
- **Dashed vs solid borders**: Tasks without both `startDate` and `dueDate` render with dashed borders; `etaDate` serves as a fallback display position.
- **Optimistic updates**: Client updates Zustand state immediately on user action, then emits WebSocket event for other clients.
