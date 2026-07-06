import React from 'react';
import PriorityBadge, { PRIORITY_CONFIG } from './PriorityBadge';
import UserAvatar from './UserAvatar';
import { Calendar, MessageCircle, Clock, Bug, Lightbulb, Wrench, TrendingUp } from 'lucide-react';

const TYPE_ICONS = {
  bug:         <Bug size={11} />,
  feature:     <Lightbulb size={11} />,
  task:        <Wrench size={11} />,
  improvement: <TrendingUp size={11} />,
};

const TYPE_LABELS = {
  bug: 'Hata', feature: 'Özellik', task: 'Görev', improvement: 'İyileştirme',
};

export default function TaskCard({ task, assignee, onClick, onDragStart, onDragEnd }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const borderColor = PRIORITY_CONFIG[task.priority]?.color || '#6b7280';

  return (
    <div
      className="task-card"
      style={{ borderLeft: `3px solid ${borderColor}` }}
      onClick={() => onClick && onClick(task)}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart && onDragStart(task);
      }}
      onDragEnd={onDragEnd}
    >
      {/* Header row */}
      <div className="task-card-header">
        <span className="task-card-type">
          {TYPE_ICONS[task.type] || <Wrench size={11} />}
          <span>{task.issueKey || TYPE_LABELS[task.type] || 'Görev'}</span>
        </span>
        <PriorityBadge priority={task.priority} showLabel={false} />
      </div>

      {/* Title */}
      <p className="task-card-title">{task.title}</p>

      {/* Footer */}
      <div className="task-card-footer">
        <div className="task-card-meta">
          {task.dueDate && (
            <span className={`task-card-due ${isOverdue ? 'overdue' : ''}`}>
              <Calendar size={11} />
              {new Date(task.dueDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
            </span>
          )}
          {task.comments?.length > 0 && (
            <span className="task-card-comments">
              <MessageCircle size={11} /> {task.comments.length}
            </span>
          )}
        </div>
        {assignee && <UserAvatar user={assignee} size={22} />}
      </div>
    </div>
  );
}
