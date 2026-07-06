import React from 'react';

const STATUS_CONFIG = {
  backlog:     { label: 'Backlog',       color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  todo:        { label: 'Yapılacak',     color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  in_progress: { label: 'Yapılıyor',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  review:      { label: 'İncelemede',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  done:        { label: 'Tamamlandı',    color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

export const STATUS_LIST = ['backlog', 'todo', 'in_progress', 'review', 'done'];
export const STATUS_LABELS = {
  backlog: 'Backlog',
  todo: 'Yapılacak',
  in_progress: 'Yapılıyor',
  review: 'İncelemede',
  done: 'Tamamlandı',
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 99,
        background: cfg.bg,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
