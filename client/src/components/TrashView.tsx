import React, { useEffect } from 'react';
import { useTaskStore, TaskCard } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useThemeStore } from '../store/themeStore';

interface Props {
  onClose: () => void;
}

export function TrashView({ onClose }: Props) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const { trashedTasks, trashLoading, fetchTrashedTasks, restoreTask, permanentDeleteTask } = useTaskStore();
  const colors = useThemeStore((s) => s.colors);

  useEffect(() => {
    if (currentProject) {
      fetchTrashedTasks(currentProject.id);
    }
  }, [currentProject, fetchTrashedTasks]);

  const handleRestore = async (id: string) => {
    await restoreTask(id);
  };

  const handlePermanentDelete = async (id: string) => {
    if (confirm('Permanently delete this task? This cannot be undone.')) {
      await permanentDeleteTask(id);
    }
  };

  const priorityColors: Record<string, string> = {
    low: '#2d6a4f',
    medium: '#0096c7',
    high: '#e76f51',
    urgent: '#e94560',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: colors.overlayBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: colors.bgSecondary, borderRadius: 12, padding: 28,
        width: 640, maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        border: `1px solid ${colors.borderPrimary}`, boxShadow: colors.modalShadow,
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: colors.textPrimary, margin: 0, fontSize: 18 }}>
            Trash
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: colors.textMuted,
            fontSize: 24, cursor: 'pointer', padding: '0 4px',
          }}>&times;</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {trashLoading ? (
            <div style={{ color: colors.textMuted, textAlign: 'center', padding: 40 }}>
              Loading...
            </div>
          ) : trashedTasks.length === 0 ? (
            <div style={{ color: colors.textMuted, textAlign: 'center', padding: 40, fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>&#128465;</div>
              Trash is empty
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trashedTasks.map((task) => (
                <div key={task.id} style={{
                  background: colors.bgPrimary,
                  border: `1px solid ${colors.borderSecondary}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  {/* Color indicator */}
                  <div style={{
                    width: 4, height: 36, borderRadius: 2,
                    background: task.color || '#1d3557', flexShrink: 0,
                  }} />

                  {/* Task info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: colors.textPrimary, fontSize: 14, fontWeight: 500,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {task.title}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 11, color: priorityColors[task.priority] || colors.textMuted,
                        fontWeight: 600, textTransform: 'uppercase',
                      }}>
                        {task.priority}
                      </span>
                      {task.deletedAt && (
                        <span style={{ fontSize: 11, color: colors.textMuted }}>
                          Deleted {new Date(task.deletedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleRestore(task.id)}
                    title="Restore task"
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none',
                      background: '#2d6a4f', color: '#fff', fontSize: 12,
                      cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
                    }}
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(task.id)}
                    title="Permanently delete"
                    style={{
                      padding: '6px 14px', borderRadius: 6, border: 'none',
                      background: '#e94560', color: '#fff', fontSize: 12,
                      cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
