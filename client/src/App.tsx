import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useProjectStore } from './store/projectStore';
import { useTaskStore } from './store/taskStore';
import { useThemeStore } from './store/themeStore';
import { AuthPage } from './components/AuthPage';
import { ProjectSelector } from './components/ProjectSelector';
import { GanttChart } from './components/GanttChart';
import { TrashView } from './components/TrashView';
import { useSocket } from './hooks/useSocket';

function AppContent() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const { fetchTasks } = useTaskStore();
  const colors = useThemeStore((s) => s.colors);
  const [showTrash, setShowTrash] = useState(false);

  // Connect socket for the current project
  useSocket(currentProject?.id ?? null);

  useEffect(() => {
    if (currentProject) {
      fetchTasks(currentProject.id);
    }
  }, [currentProject, fetchTasks]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ProjectSelector onTrashClick={() => setShowTrash(true)} />
      <div style={{ flex: 1, marginTop: 48, position: 'relative' }}>
        {currentProject ? (
          <GanttChart />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: colors.textMuted,
            fontSize: 16,
            background: colors.bgPrimary,
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
      {showTrash && currentProject && <TrashView onClose={() => setShowTrash(false)} />}
    </div>
  );
}

export default function App() {
  const { user, loading, checkAuth } = useAuthStore();
  const colors = useThemeStore((s) => s.colors);

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
        background: colors.bgPrimary,
        color: colors.textMuted,
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
