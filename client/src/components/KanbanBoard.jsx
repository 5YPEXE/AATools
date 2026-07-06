import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { STATUS_LIST, STATUS_LABELS, STATUS_CONFIG } from './StatusBadge';
import { Plus } from 'lucide-react';

const COLUMN_ICONS = {
  backlog: '🗂️', todo: '📋', in_progress: '⚙️', review: '🔍', done: '✅'
};

export default function KanbanBoard({ tasks, allUsers, onTaskClick, onStatusChange, onAddTask, isLeader }) {
  const [dragOverCol, setDragOverCol] = useState(null);

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== targetStatus) {
        onStatusChange(taskId, targetStatus);
      }
    }
    setDragOverCol(null);
  };

  const handleDragOver = (e, col) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  return (
    <div className="kanban-board">
      {STATUS_LIST.map(col => {
        const colTasks = tasks.filter(t => t.status === col);
        const isDragOver = dragOverCol === col;
        const cfg = STATUS_CONFIG[col];

        return (
          <div
            key={col}
            className={`kanban-col${isDragOver ? ' drag-over' : ''}`}
            onDrop={e => handleDrop(e, col)}
            onDragOver={e => handleDragOver(e, col)}
            onDragLeave={() => setDragOverCol(null)}
          >
            {/* Column Header */}
            <div className="kanban-col-header">
              <div className="kanban-col-title">
                <span>{COLUMN_ICONS[col]}</span>
                <span style={{ color: cfg?.color }}>{STATUS_LABELS[col]}</span>
                <span className="kanban-col-count">{colTasks.length}</span>
              </div>
              {isLeader && col !== 'done' && (
                <button
                  className="kanban-add-btn"
                  onClick={() => onAddTask && onAddTask(col)}
                  title="Görev ekle"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>

            {/* Cards */}
            <div className="kanban-cards">
              {colTasks.length === 0 && (
                <div className="kanban-empty">
                  Görev yok
                </div>
              )}
              {colTasks.map(task => {
                const assignee = allUsers.find(u => u.id === task.assigneeId);
                return (
                  <TaskCard
                    key={task.id}
                    task={task}
                    assignee={assignee}
                    onClick={onTaskClick}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
