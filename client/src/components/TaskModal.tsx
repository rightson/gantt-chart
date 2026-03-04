import React, { useState, useEffect } from 'react';
import { useTaskStore, TaskCard } from '../store/taskStore';
import { useSocket } from '../hooks/useSocket';
import { useProjectStore } from '../store/projectStore';

interface Props {
  taskId: string;
  onClose: () => void;
}

export function TaskModal({ taskId, onClose }: Props) {
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === taskId));
  const { updateTask, deleteTask } = useTaskStore();
  const currentProject = useProjectStore((s) => s.currentProject);
  const socketRef = useSocket(currentProject?.id ?? null);

  const [form, setForm] = useState<Partial<TaskCard>>({});

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        category: task.category || '',
        tags: task.tags,
        startDate: task.startDate ? task.startDate.slice(0, 10) : '',
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
        etaDate: task.etaDate ? task.etaDate.slice(0, 10) : '',
        priority: task.priority,
        status: task.status,
        color: task.color || '#1d3557',
      });
    }
  }, [task]);

  if (!task) return null;

  const isLocked = task.isLocked;

  const handleChange = (field: string, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    const changes: Partial<TaskCard> = {};
    if (form.title !== task.title) changes.title = form.title;
    if (form.description !== (task.description || '')) changes.description = form.description;
    if (form.category !== (task.category || '')) changes.category = form.category;
    if (form.priority !== task.priority) changes.priority = form.priority;
    if (form.status !== task.status) changes.status = form.status;
    if (form.color !== (task.color || '#1d3557')) changes.color = form.color;

    // Date handling
    const sd = form.startDate as string;
    const dd = form.dueDate as string;
    const ed = form.etaDate as string;

    if (sd && sd !== (task.startDate?.slice(0, 10) || '')) {
      changes.startDate = new Date(sd).toISOString();
    } else if (!sd && task.startDate) {
      changes.startDate = null;
    }

    if (dd && dd !== (task.dueDate?.slice(0, 10) || '')) {
      changes.dueDate = new Date(dd).toISOString();
    } else if (!dd && task.dueDate) {
      changes.dueDate = null;
    }

    if (ed && ed !== (task.etaDate?.slice(0, 10) || '')) {
      changes.etaDate = new Date(ed).toISOString();
    } else if (!ed && task.etaDate) {
      changes.etaDate = null;
    }

    if (Object.keys(changes).length > 0) {
      await updateTask(task.id, changes);
      if (socketRef.current && currentProject) {
        socketRef.current.emit('task:updated', {
          projectId: currentProject.id,
          taskId: task.id,
          changes,
        });
      }
    }
    onClose();
  };

  const handleLockToggle = async () => {
    const newLocked = !task.isLocked;
    await updateTask(task.id, { isLocked: newLocked });
    if (socketRef.current && currentProject) {
      socketRef.current.emit('task:updated', {
        projectId: currentProject.id,
        taskId: task.id,
        changes: { isLocked: newLocked },
      });
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this task?')) {
      await deleteTask(task.id);
      if (socketRef.current && currentProject) {
        socketRef.current.emit('task:deleted', {
          projectId: currentProject.id,
          taskId: task.id,
        });
      }
      onClose();
    }
  };

  const tagsStr = (form.tags || []).join(', ');

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: '#e0e0ff', margin: 0, fontSize: 18 }}>
            {isLocked ? '🔒 ' : ''}Edit Task
          </h2>
          <button onClick={onClose} style={closeBtnStyle}>&times;</button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title</label>
            <input
              style={inputStyle}
              value={form.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              disabled={isLocked}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, height: 80, resize: 'vertical' }}
              value={form.description as string || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={isLocked}
            />
          </div>

          {/* Row: category, priority, status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <input
                style={inputStyle}
                value={form.category as string || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                style={inputStyle}
                value={form.priority || 'medium'}
                onChange={(e) => handleChange('priority', e.target.value)}
                disabled={isLocked}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                style={inputStyle}
                value={form.status || 'todo'}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={isLocked}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <input
              style={inputStyle}
              value={tagsStr}
              onChange={(e) => handleChange('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              disabled={isLocked}
            />
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input
                type="date"
                style={inputStyle}
                value={form.startDate as string || ''}
                onChange={(e) => handleChange('startDate', e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date"
                style={inputStyle}
                value={form.dueDate as string || ''}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                disabled={isLocked}
              />
            </div>
            <div>
              <label style={labelStyle}>ETA</label>
              <input
                type="date"
                style={inputStyle}
                value={form.etaDate as string || ''}
                onChange={(e) => handleChange('etaDate', e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="color"
                value={form.color as string || '#1d3557'}
                onChange={(e) => handleChange('color', e.target.value)}
                disabled={isLocked}
                style={{ width: 40, height: 32, border: 'none', cursor: 'pointer' }}
              />
              {['#1d3557', '#2d6a4f', '#e76f51', '#e94560', '#7b2cbf', '#0096c7', '#ff9f1c'].map(c => (
                <div
                  key={c}
                  onClick={() => !isLocked && handleChange('color', c)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    background: c,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    border: form.color === c ? '2px solid #fff' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleLockToggle} style={{
              ...actionBtnStyle,
              background: task.isLocked ? '#2d6a4f' : '#e76f51',
            }}>
              {task.isLocked ? 'Unlock' : 'Lock'}
            </button>
            <button onClick={handleDelete} style={{ ...actionBtnStyle, background: '#e94560' }}>
              Delete
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ ...actionBtnStyle, background: '#333' }}>
              Cancel
            </button>
            <button onClick={handleSave} style={{ ...actionBtnStyle, background: '#0f3460' }} disabled={isLocked}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: '#1a1a2e',
  borderRadius: 12,
  padding: 28,
  width: 560,
  maxWidth: '95vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  border: '1px solid #0f3460',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#8888aa',
  fontSize: 11,
  marginBottom: 4,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: '#0d1117',
  border: '1px solid #333',
  borderRadius: 6,
  color: '#e0e0ff',
  fontSize: 13,
  outline: 'none',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888',
  fontSize: 24,
  cursor: 'pointer',
  padding: '0 4px',
};

const actionBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 6,
  border: 'none',
  color: '#fff',
  fontSize: 13,
  cursor: 'pointer',
  fontWeight: 500,
};
