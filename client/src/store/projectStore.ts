import { create } from 'zustand';
import { api } from '../utils/api';

interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const projects = await api.get<Project[]>('/projects');
      set({ projects, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createProject: async (name, description) => {
    const project = await api.post<Project>('/projects', { name, description });
    set((s) => ({ projects: [...s.projects, project] }));
    return project;
  },

  setCurrentProject: (project) => set({ currentProject: project }),
}));
