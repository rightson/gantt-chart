import React, { useRef, useCallback, useState } from 'react';
import { TaskCard, useTaskStore } from '../store/taskStore';
import { dateToX, xToDate, ZoomConfig } from '../utils/date';
import { useSocket } from '../hooks/useSocket';
import { useProjectStore } from '../store/projectStore';

interface Props {
  task: TaskCard;
  origin: Date;
  zoom: ZoomConfig;
  scrollX: number;
  scrollY: number;
  rowHeight: number;
  taskHeight: number;
  taskPadding: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#2d6a4f',
  medium: '#1d3557',
  high: '#e76f51',
  urgent: '#e94560',
};

const STATUS_ICONS: Record<string, string> = {
  todo: '○',
  in_progress: '◐',
  done: '●',
};

export function TaskCardComponent({
  task, origin, zoom, scrollX, scrollY, rowHeight, taskHeight, taskPadding,
}: Props) {
  const { updateTask, setModalTask, setSelectedTask, selectedTaskId } = useTaskStore();
  const currentProject = useProjectStore((s) => s.currentProject);
  const socketRef = useSocket(currentProject?.id ?? null);

  const dragState = useRef<{
    type: 'move' | 'resize-left' | 'resize-right';
    startMouseX: number;
    startX: number;
    startWidth: number;
    startDate?: string | null;
    dueDate?: string | null;
    startRow: number;
    startMouseY: number;
  } | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const clickTimer = useRef<number | null>(null);

  // Position calculations
  const hasStartDate = !!task.startDate;
  const hasDueDate = !!task.dueDate;
  const hasEta = !!task.etaDate;
  const displayDate = task.startDate || task.etaDate || new Date().toISOString();
  const endDate = task.dueDate || (task.startDate
    ? new Date(new Date(task.startDate).getTime() + 86400000).toISOString()
    : task.etaDate
      ? new Date(new Date(task.etaDate).getTime() + 86400000).toISOString()
      : new Date(new Date().getTime() + 86400000).toISOString());

  const x = dateToX(new Date(displayDate), origin, zoom) - scrollX;
  const endX = dateToX(new Date(endDate), origin, zoom) - scrollX;
  const width = Math.max(endX - x, 30);
  const y = task.row * rowHeight + taskPadding - scrollY;

  const isDashed = !hasStartDate || !hasDueDate;
  const isSelected = selectedTaskId === task.id;
  const isLocked = task.isLocked;
  const bgColor = task.color || PRIORITY_COLORS[task.priority] || '#1d3557';

  const emitUpdate = useCallback((changes: Partial<TaskCard>) => {
    if (socketRef.current && currentProject) {
      socketRef.current.emit('task:updated', {
        projectId: currentProject.id,
        taskId: task.id,
        changes,
      });
    }
  }, [socketRef, currentProject, task.id]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize-left' | 'resize-right') => {
    if (isLocked) return;
    e.stopPropagation();
    e.preventDefault();

    dragState.current = {
      type,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: x + scrollX,
      startWidth: width,
      startDate: task.startDate,
      dueDate: task.dueDate,
      startRow: task.row,
    };

    const handleMove = (ev: MouseEvent) => {
      if (!dragState.current) return;
      setIsDragging(true);
      const dx = ev.clientX - dragState.current.startMouseX;
      const dy = ev.clientY - dragState.current.startMouseY;

      if (dragState.current.type === 'move') {
        const newX = dragState.current.startX + dx;
        const newStartDate = xToDate(newX, origin, zoom);
        const duration = task.dueDate && task.startDate
          ? new Date(task.dueDate).getTime() - new Date(task.startDate).getTime()
          : 86400000;
        const newDueDate = new Date(newStartDate.getTime() + duration);
        const newRow = Math.max(0, dragState.current.startRow + Math.round(dy / rowHeight));

        updateTask(task.id, {
          startDate: newStartDate.toISOString(),
          dueDate: newDueDate.toISOString(),
          row: newRow,
        });
      } else if (dragState.current.type === 'resize-right') {
        const newEndX = dragState.current.startX + dragState.current.startWidth + dx;
        const newDueDate = xToDate(newEndX, origin, zoom);
        updateTask(task.id, { dueDate: newDueDate.toISOString() });
      } else if (dragState.current.type === 'resize-left') {
        const newX = dragState.current.startX + dx;
        const newStartDate = xToDate(newX, origin, zoom);
        updateTask(task.id, { startDate: newStartDate.toISOString() });
      }
    };

    const handleUp = () => {
      if (dragState.current) {
        const changes: Partial<TaskCard> = {};
        const t = useTaskStore.getState().tasks.find(t => t.id === task.id);
        if (t) {
          if (t.startDate) changes.startDate = t.startDate;
          if (t.dueDate) changes.dueDate = t.dueDate;
          changes.row = t.row;
          emitUpdate(changes);
        }
      }
      dragState.current = null;
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [isLocked, x, scrollX, width, task, origin, zoom, rowHeight, updateTask, emitUpdate]);

  // Click handlers
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) return;

    if (clickTimer.current) {
      // Double click
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      setModalTask(task.id);
    } else {
      clickTimer.current = window.setTimeout(() => {
        clickTimer.current = null;
        setSelectedTask(task.id);
      }, 250);
    }
  }, [isDragging, task.id, setModalTask, setSelectedTask]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height: taskHeight,
        background: bgColor,
        border: `2px ${isDashed ? 'dashed' : 'solid'} ${isSelected ? '#00d2ff' : 'rgba(255,255,255,0.2)'}`,
        borderRadius: 6,
        cursor: isLocked ? 'not-allowed' : 'grab',
        display: 'flex',
        alignItems: 'center',
        padding: '0 6px',
        fontSize: 11,
        color: '#fff',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        opacity: task.status === 'done' ? 0.7 : 1,
        boxShadow: isSelected ? '0 0 0 2px #00d2ff' : '0 1px 3px rgba(0,0,0,0.3)',
        transition: isDragging ? 'none' : 'box-shadow 0.15s',
        zIndex: isDragging ? 100 : isSelected ? 50 : 1,
        lineHeight: '36px',
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      onClick={handleClick}
    >
      {/* Left resize handle */}
      {!isLocked && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 8,
            height: '100%',
            cursor: 'ew-resize',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'resize-left')}
        />
      )}

      {/* Content */}
      <span style={{ marginRight: 4, opacity: 0.7 }}>{STATUS_ICONS[task.status]}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {task.title}
      </span>
      {task.priority === 'urgent' && (
        <span style={{ marginLeft: 4, color: '#ff6b6b', fontSize: 10 }}>!</span>
      )}
      {isLocked && (
        <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }}>🔒</span>
      )}
      {hasEta && !hasStartDate && (
        <span style={{ marginLeft: 4, fontSize: 9, opacity: 0.6, background: 'rgba(0,0,0,0.3)', padding: '1px 3px', borderRadius: 2 }}>
          ETA
        </span>
      )}

      {/* Right resize handle */}
      {!isLocked && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 8,
            height: '100%',
            cursor: 'ew-resize',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'resize-right')}
        />
      )}
    </div>
  );
}
