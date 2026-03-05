import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore, ThemeMode } from '../store/themeStore';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: '🌙' },
  { value: 'light', label: '☀️' },
  { value: 'system', label: '💻' },
];

export function ProjectSelector() {
  const { projects, currentProject, fetchProjects, createProject, setCurrentProject } = useProjectStore();
  const { user, logout } = useAuthStore();
  const { mode, setMode, colors } = useThemeStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchProjects().then(() => {
      // On load, restore project from URL
      const params = new URLSearchParams(window.location.search);
      const projectId = params.get('project');
      if (projectId) {
        const { projects } = useProjectStore.getState();
        const p = projects.find(p => p.id === projectId);
        if (p) setCurrentProject(p);
      }
    });
  }, [fetchProjects, setCurrentProject]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const p = await createProject(newName.trim());
    setCurrentProject(p);
    // Update URL with new project
    const url = new URL(window.location.href);
    url.searchParams.set('project', p.id);
    window.history.replaceState({}, '', url.toString());
    setShowCreate(false);
    setNewName('');
  };

  const smallBtn: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    background: colors.btnPrimary,
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  };

  const inputS: React.CSSProperties = {
    background: colors.bgInput,
    border: `1px solid ${colors.borderSecondary}`,
    borderRadius: 6,
    color: colors.textPrimary,
    padding: '6px 10px',
    fontSize: 13,
    outline: 'none',
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 48,
      background: colors.bgSecondary,
      borderBottom: `1px solid ${colors.borderPrimary}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      zIndex: 100,
      gap: 12,
    }}>
      {/* Logo */}
      <span style={{ color: colors.accent, fontWeight: 700, fontSize: 16, marginRight: 8 }}>
        Gantt
      </span>

      {/* Project dropdown */}
      <select
        style={{ ...inputS, minWidth: 180 }}
        value={currentProject?.id || ''}
        onChange={(e) => {
          const p = projects.find(p => p.id === e.target.value);
          setCurrentProject(p || null);
          // Update URL
          const url = new URL(window.location.href);
          if (p) {
            url.searchParams.set('project', p.id);
          } else {
            url.searchParams.delete('project');
          }
          window.history.replaceState({}, '', url.toString());
        }}
      >
        <option value="">Select project...</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {/* New project */}
      {showCreate ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            style={{ ...inputS, width: 200 }}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button onClick={handleCreate} style={smallBtn}>Create</button>
          <button onClick={() => setShowCreate(false)} style={{ ...smallBtn, background: colors.btnSecondary, color: colors.textPrimary }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setShowCreate(true)} style={smallBtn}>+ New Project</button>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <div style={{ display: 'flex', gap: 2, background: colors.bgPrimary, borderRadius: 6, padding: 2 }}>
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMode(opt.value)}
            title={opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              border: 'none',
              background: mode === opt.value ? colors.btnPrimary : 'transparent',
              color: mode === opt.value ? '#fff' : colors.textMuted,
              fontSize: 14,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* User info */}
      <span style={{ color: colors.textMuted, fontSize: 12 }}>
        {user?.name} ({user?.email})
      </span>
      <button onClick={logout} style={{ ...smallBtn, background: colors.btnSecondary, color: colors.textPrimary }}>
        Logout
      </button>
    </div>
  );
}
