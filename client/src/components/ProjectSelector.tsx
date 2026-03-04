import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';

export function ProjectSelector() {
  const { projects, currentProject, fetchProjects, createProject, setCurrentProject } = useProjectStore();
  const { user, logout } = useAuthStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const p = await createProject(newName.trim());
    setCurrentProject(p);
    setShowCreate(false);
    setNewName('');
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 48,
      background: '#1a1a2e',
      borderBottom: '1px solid #0f3460',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      zIndex: 100,
      gap: 12,
    }}>
      {/* Logo */}
      <span style={{ color: '#0096c7', fontWeight: 700, fontSize: 16, marginRight: 8 }}>
        Gantt
      </span>

      {/* Project dropdown */}
      <select
        style={{
          background: '#0d1117',
          border: '1px solid #333',
          borderRadius: 6,
          color: '#e0e0ff',
          padding: '6px 10px',
          fontSize: 13,
          outline: 'none',
          minWidth: 180,
        }}
        value={currentProject?.id || ''}
        onChange={(e) => {
          const p = projects.find(p => p.id === e.target.value);
          setCurrentProject(p || null);
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
            style={{
              background: '#0d1117',
              border: '1px solid #333',
              borderRadius: 6,
              color: '#e0e0ff',
              padding: '6px 10px',
              fontSize: 13,
              outline: 'none',
              width: 200,
            }}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button onClick={handleCreate} style={smallBtnStyle}>Create</button>
          <button onClick={() => setShowCreate(false)} style={{ ...smallBtnStyle, background: '#333' }}>Cancel</button>
        </div>
      ) : (
        <button onClick={() => setShowCreate(true)} style={smallBtnStyle}>+ New Project</button>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User info */}
      <span style={{ color: '#8888aa', fontSize: 12 }}>
        {user?.name} ({user?.email})
      </span>
      <button onClick={logout} style={{ ...smallBtnStyle, background: '#333' }}>
        Logout
      </button>
    </div>
  );
}

const smallBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: 'none',
  background: '#0f3460',
  color: '#e0e0ff',
  fontSize: 12,
  cursor: 'pointer',
  fontWeight: 500,
  whiteSpace: 'nowrap',
};
