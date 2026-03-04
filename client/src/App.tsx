import React, { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useProjectStore } from './store/projectStore';
import { useTaskStore } from './store/taskStore';
import { AuthPage } from './components/AuthPage';
import { ProjectSelector } from './components/ProjectSelector';
import { GanttChart } from './components/GanttChart';
import { useSocket } from './hooks/useSocket';

function AppContent() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const { fetchTasks } = useTaskStore();

  // Connect socket for the current project
  useSocket(currentProject?.id ?? null);

  useEffect(() => {
    if (currentProject) {
      fetchTasks(currentProject.id);
    }
  }, [currentProject, fetchTasks]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ProjectSelector />
      <div style={{ flex: 1, marginTop: 48, position: 'relative' }}>
        {currentProject ? (
          <GanttChart />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#8888aa',
            fontSize: 16,
            background: '#0d1117',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📊</div>
              <div>Select a project or create a new one to get started</div>
              <div style={{ fontSize: 12, marginTop: 8, opacity: 0.5 }}>
                Double-click on the chart to create task cards
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d1117',
        color: '#8888aa',
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <AppContent />;
}
