import { create } from 'zustand';
import { api } from '../utils/api';

export interface TaskCard {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  category?: string;
  tags: string[];
  ownerId?: string;
  memberIds: string[];
  startDate?: string | null;
  dueDate?: string | null;
  etaDate?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done';
  isLocked: boolean;
  row: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

interface TaskState {
  tasks: TaskCard[];
  trashedTasks: TaskCard[];
  selectedTaskId: string | null;
  modalTaskId: string | null;
  loading: boolean;
  trashLoading: boolean;
  fetchTasks: (projectId: string) => Promise<void>;
  fetchTrashedTasks: (projectId: string) => Promise<void>;
  createTask: (data: Partial<TaskCard> & { projectId: string; title: string }) => Promise<TaskCard>;
  updateTask: (id: string, changes: Partial<TaskCard>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<TaskCard>;
  permanentDeleteTask: (id: string) => Promise<void>;
  setSelectedTask: (id: string | null) => void;
  setModalTask: (id: string | null) => void;
  applyRemoteUpdate: (taskId: string, changes: Partial<TaskCard>) => void;
  applyRemoteCreate: (task: TaskCard) => void;
  applyRemoteDelete: (taskId: string) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  trashedTasks: [],
  selectedTaskId: null,
  modalTaskId: null,
  loading: false,
  trashLoading: false,

  fetchTasks: async (projectId) => {
    set({ loading: true });
    try {
      const tasks = await api.get<TaskCard[]>(`/tasks/project/${projectId}`);
      set({ tasks, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchTrashedTasks: async (projectId) => {
    set({ trashLoading: true });
    try {
      const trashedTasks = await api.get<TaskCard[]>(`/tasks/project/${projectId}/trash`);
      set({ trashedTasks, trashLoading: false });
    } catch {
      set({ trashLoading: false });
    }
  },

  createTask: async (data) => {
    const task = await api.post<TaskCard>('/tasks', data);
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (id, changes) => {
    const task = get().tasks.find(t => t.id === id);
    if (task?.isLocked) return;
    await api.patch<TaskCard>(`/tasks/${id}`, changes);
    set((s) => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, ...changes } : t),
    }));
  },

  deleteTask: async (id) => {
    await api.delete(`/tasks/${id}`);
    set((s) => ({ tasks: s.tasks.filter(t => t.id !== id) }));
  },

  restoreTask: async (id) => {
    const task = await api.post<TaskCard>(`/tasks/${id}/restore`, {});
    set((s) => ({
      trashedTasks: s.trashedTasks.filter(t => t.id !== id),
      tasks: [...s.tasks, task],
    }));
    return task;
  },

  permanentDeleteTask: async (id) => {
    await api.delete(`/tasks/${id}/permanent`);
    set((s) => ({ trashedTasks: s.trashedTasks.filter(t => t.id !== id) }));
  },

  setSelectedTask: (id) => set({ selectedTaskId: id }),
  setModalTask: (id) => set({ modalTaskId: id }),

  applyRemoteUpdate: (taskId, changes) => {
    set((s) => ({
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...changes } : t),
    }));
  },

  applyRemoteCreate: (task) => {
    set((s) => {
      if (s.tasks.find(t => t.id === task.id)) return s;
      return { tasks: [...s.tasks, task] };
    });
  },

  applyRemoteDelete: (taskId) => {
    set((s) => ({ tasks: s.tasks.filter(t => t.id !== taskId) }));
  },
}));
