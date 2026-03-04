import { Server, Socket } from 'socket.io';
import { verifyToken } from '../middleware/auth.js';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

export function setupWebSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyToken(token);
      (socket as any).userId = payload.userId;
      (socket as any).userEmail = payload.email;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`User ${userId} connected`);

    // Join a project room
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user:joined', { userId });
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user:left', { userId });
    });

    // Task real-time events
    socket.on('task:created', (data: { projectId: string; task: any }) => {
      socket.to(`project:${data.projectId}`).emit('task:created', data.task);
    });

    socket.on('task:updated', (data: { projectId: string; taskId: string; changes: any }) => {
      // Persist changes
      const existing = db.select().from(schema.tasks).where(eq(schema.tasks.id, data.taskId)).get();
      if (existing && !existing.isLocked) {
        const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
        const changes = data.changes;

        if (changes.title !== undefined) updates.title = changes.title;
        if (changes.description !== undefined) updates.description = changes.description;
        if (changes.startDate !== undefined) updates.start_date = changes.startDate;
        if (changes.dueDate !== undefined) updates.due_date = changes.dueDate;
        if (changes.etaDate !== undefined) updates.eta_date = changes.etaDate;
        if (changes.row !== undefined) updates.row = changes.row;
        if (changes.status !== undefined) updates.status = changes.status;
        if (changes.priority !== undefined) updates.priority = changes.priority;
        if (changes.category !== undefined) updates.category = changes.category;
        if (changes.color !== undefined) updates.color = changes.color;
        if (changes.isLocked !== undefined) updates.is_locked = changes.isLocked ? 1 : 0;
        if (changes.tags !== undefined) updates.tags = JSON.stringify(changes.tags);
        if (changes.memberIds !== undefined) updates.member_ids = JSON.stringify(changes.memberIds);

        db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, data.taskId)).run();
      }

      socket.to(`project:${data.projectId}`).emit('task:updated', {
        taskId: data.taskId,
        changes: data.changes,
        userId,
      });
    });

    socket.on('task:deleted', (data: { projectId: string; taskId: string }) => {
      socket.to(`project:${data.projectId}`).emit('task:deleted', {
        taskId: data.taskId,
        userId,
      });
    });

    // Cursor tracking for collaboration
    socket.on('cursor:move', (data: { projectId: string; x: number; y: number; userName: string }) => {
      socket.to(`project:${data.projectId}`).emit('cursor:move', {
        userId,
        userName: data.userName,
        x: data.x,
        y: data.y,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
}
