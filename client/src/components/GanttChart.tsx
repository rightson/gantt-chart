import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useChartStore, getZoomConfig } from '../store/chartStore';
import { useTaskStore, TaskCard } from '../store/taskStore';
import { useThemeStore } from '../store/themeStore';
import { dateToX, xToDate, generateTimelineUnits, generateSubHeaders } from '../utils/date';
import { TaskCardComponent } from './TaskCard';
import { TaskModal } from './TaskModal';
import { useProjectStore } from '../store/projectStore';

const HEADER_HEIGHT = 60;
const ROW_HEIGHT = 48;
const TASK_HEIGHT = 36;
const TASK_PADDING = 6;

export function GanttChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, scrollX: 0, scrollY: 0 });

  const {
    scrollX, scrollY, zoomLevel, origin, viewportWidth, viewportHeight,
    setScroll, setScrollX, setScrollY, zoomIn, zoomOut, setViewport,
  } = useChartStore();

  const { tasks, modalTaskId, setModalTask, createTask, selectedTaskId, setSelectedTask } = useTaskStore();
  const currentProject = useProjectStore((s) => s.currentProject);
  const colors = useThemeStore((s) => s.colors);
  const zoom = getZoomConfig(zoomLevel);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setViewport(width, height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [setViewport]);

  // Mouse wheel for zoom and scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    } else {
      setScroll(scrollX + e.deltaX, Math.max(0, scrollY + e.deltaY));
    }
  }, [scrollX, scrollY, zoomIn, zoomOut, setScroll]);

  // Pan dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY, scrollX, scrollY };
      e.preventDefault();
    }
  }, [scrollX, scrollY]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = dragStart.current.x - e.clientX;
      const dy = dragStart.current.y - e.clientY;
      setScroll(dragStart.current.scrollX + dx, Math.max(0, dragStart.current.scrollY + dy));
    }
  }, [setScroll]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Double-click to create task
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!currentProject) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollX;
    const y = e.clientY - rect.top + scrollY - HEADER_HEIGHT;

    if (y < 0) return;

    const row = Math.floor(y / ROW_HEIGHT);
    const date = xToDate(x, origin, zoom);
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + 1);

    createTask({
      projectId: currentProject.id,
      title: 'New Task',
      startDate: startDate.toISOString(),
      dueDate: dueDate.toISOString(),
      row,
    });
  }, [currentProject, scrollX, scrollY, origin, zoom, createTask]);

  // Generate timeline
  const timelineUnits = generateTimelineUnits(origin, scrollX, viewportWidth, zoom);
  const subHeaders = generateSubHeaders(origin, scrollX, viewportWidth, zoom);

  // Today marker
  const todayX = dateToX(new Date(), origin, zoom) - scrollX;

  // Calculate total rows
  const maxRow = tasks.length > 0 ? Math.max(...tasks.map(t => t.row)) + 3 : 10;
  const totalHeight = HEADER_HEIGHT + maxRow * ROW_HEIGHT;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        cursor: isDragging.current ? 'grabbing' : 'default',
        userSelect: 'none',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Sub-header (year/month grouping) */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 24,
        background: colors.bgSecondary,
        borderBottom: `1px solid ${colors.borderSecondary}`,
        overflow: 'hidden',
        zIndex: 10,
      }}>
        {subHeaders.map((unit, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: unit.x - scrollX,
              width: unit.width,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: 600,
              borderRight: `1px solid ${colors.borderSecondary}`,
            }}
          >
            {unit.label}
          </div>
        ))}
      </div>

      {/* Main header (time units) */}
      <div style={{
        position: 'absolute',
        top: 24,
        left: 0,
        right: 0,
        height: 36,
        background: colors.bgTertiary,
        borderBottom: `2px solid ${colors.borderPrimary}`,
        overflow: 'hidden',
        zIndex: 10,
      }}>
        {timelineUnits.map((unit, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: unit.x - scrollX,
              width: unit.width,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textPrimary,
              fontSize: 12,
              fontWeight: 500,
              borderRight: `1px solid ${colors.borderPrimary}`,
            }}
          >
            {unit.label}
          </div>
        ))}
      </div>

      {/* Grid area */}
      <div style={{
        position: 'absolute',
        top: HEADER_HEIGHT,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        background: colors.bgPrimary,
      }}>
        {/* Grid lines */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: totalHeight - HEADER_HEIGHT }}
        >
          {/* Vertical grid lines */}
          {timelineUnits.map((unit, i) => (
            <line
              key={`v${i}`}
              x1={unit.x - scrollX}
              y1={0}
              x2={unit.x - scrollX}
              y2={totalHeight}
              stroke={colors.borderGrid}
              strokeWidth={1}
            />
          ))}
          {/* Horizontal grid lines */}
          {Array.from({ length: maxRow + 1 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * ROW_HEIGHT - scrollY}
              x2={viewportWidth}
              y2={i * ROW_HEIGHT - scrollY}
              stroke={colors.borderGrid}
              strokeWidth={1}
            />
          ))}
          {/* Today marker */}
          <line
            x1={todayX}
            y1={0}
            x2={todayX}
            y2={totalHeight}
            stroke="#e94560"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </svg>

        {/* Task cards */}
        {tasks.map((task) => (
          <TaskCardComponent
            key={task.id}
            task={task}
            origin={origin}
            zoom={zoom}
            scrollX={scrollX}
            scrollY={scrollY}
            rowHeight={ROW_HEIGHT}
            taskHeight={TASK_HEIGHT}
            taskPadding={TASK_PADDING}
          />
        ))}

        {/* Today label */}
        <div style={{
          position: 'absolute',
          left: todayX - 24,
          top: -2,
          background: '#e94560',
          color: '#fff',
          fontSize: 10,
          padding: '1px 6px',
          borderRadius: 3,
          pointerEvents: 'none',
          zIndex: 5,
        }}>
          Today
        </div>
      </div>

      {/* Zoom controls */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        gap: 8,
        zIndex: 20,
      }}>
        <button onClick={zoomIn} style={{
          width: 36, height: 36, borderRadius: 6,
          border: `1px solid ${colors.borderPrimary}`,
          background: colors.zoomBg, color: colors.textPrimary,
          fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>+</button>
        <span style={{
          background: colors.zoomBg,
          color: colors.textPrimary,
          padding: '6px 12px',
          borderRadius: 6,
          fontSize: 12,
          border: `1px solid ${colors.borderPrimary}`,
        }}>
          {zoomLevel}
        </span>
        <button onClick={zoomOut} style={{
          width: 36, height: 36, borderRadius: 6,
          border: `1px solid ${colors.borderPrimary}`,
          background: colors.zoomBg, color: colors.textPrimary,
          fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>−</button>
      </div>

      {/* Task modal */}
      {modalTaskId && <TaskModal taskId={modalTaskId} onClose={() => setModalTask(null)} />}
    </div>
  );
}
