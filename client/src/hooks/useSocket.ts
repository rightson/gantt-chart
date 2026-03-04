import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';

export function useSocket(projectId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const token = useAuthStore((s) => s.token);
  const { applyRemoteUpdate, applyRemoteCreate, applyRemoteDelete } = useTaskStore();

  useEffect(() => {
    if (!token || !projectId) return;

    const socket = io(window.location.origin, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:project', projectId);
    });

    socket.on('task:created', (task) => {
      applyRemoteCreate(task);
    });

    socket.on('task:updated', (data: { taskId: string; changes: any }) => {
      applyRemoteUpdate(data.taskId, data.changes);
    });

    socket.on('task:deleted', (data: { taskId: string }) => {
      applyRemoteDelete(data.taskId);
    });

    return () => {
      socket.emit('leave:project', projectId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, projectId]);

  return socketRef;
}
