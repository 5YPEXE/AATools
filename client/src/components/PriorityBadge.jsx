import React from 'react';

const PRIORITY_CONFIG = {
  critical: { label: 'Kritik',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  dot: '#ef4444' },
  high:     { label: 'Yüksek', color: '#f97316', bg: 'rgba(249,115,22,0.12)', dot: '#f97316' },
  medium:   { label: 'Orta',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
  low:      { label: 'Düşük',  color: '#10b981', bg: 'rgba(16,185,129,0.12)', dot: '#10b981' },
};

export default function PriorityBadge({ priority, showLabel = true }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: showLabel ? '2px 8px' : '2px 4px',
        borderRadius: 99,
        background: cfg.bg,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {showLabel && cfg.label}
    </span>
  );
}

export { PRIORITY_CONFIG };
