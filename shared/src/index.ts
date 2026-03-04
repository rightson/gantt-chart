export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCard {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  category?: string;
  tags: string[];
  ownerId?: string;
  memberIds: string[];
  startDate?: string;    // ISO date string, null if unscheduled
  dueDate?: string;      // ISO date string, null if unscheduled
  etaDate?: string;      // estimated date when start/due not set
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done';
  isLocked: boolean;     // locked after completion
  row: number;           // vertical position in the chart
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// WebSocket event types
export enum WsEvent {
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_DELETED = 'task:deleted',
  TASK_MOVED = 'task:moved',
  TASK_RESIZED = 'task:resized',
  TASK_LOCKED = 'task:locked',
  USER_JOINED = 'user:joined',
  USER_LEFT = 'user:left',
  CURSOR_MOVE = 'cursor:move',
}

export interface WsTaskUpdate {
  taskId: string;
  changes: Partial<TaskCard>;
  userId: string;
}

export interface WsCursorMove {
  userId: string;
  userName: string;
  x: number;
  y: number;
}

// API request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  ownerId?: string;
  memberIds?: string[];
  startDate?: string;
  dueDate?: string;
  etaDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  row?: number;
  color?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  ownerId?: string;
  memberIds?: string[];
  startDate?: string | null;
  dueDate?: string | null;
  etaDate?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'done';
  isLocked?: boolean;
  row?: number;
  color?: string;
}
