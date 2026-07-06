import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { KEYS_STORE } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { Search, Filter } from 'lucide-react';

const ACTION_LABELS = {
  user_login:        { label: 'Giriş yapıldı',      icon: '🔑', color: '#6366f1' },
  user_logout:       { label: 'Çıkış yapıldı',      icon: '🚪', color: '#6b7280' },
  user_created:      { label: 'Kullanıcı oluşturuldu', icon: '👤', color: '#10b981' },
  user_updated:      { label: 'Kullanıcı güncellendi', icon: '✏️', color: '#f59e0b' },
  password_changed:  { label: 'Şifre değiştirildi', icon: '🔒', color: '#8b5cf6' },
  task_created:      { label: 'Görev oluşturuldu',  icon: '➕', color: '#10b981' },
  task_updated:      { label: 'Görev güncellendi',  icon: '✏️', color: '#f59e0b' },
  task_assigned:     { label: 'Görev atandı',       icon: '👥', color: '#3b82f6' },
  task_transferred:  { label: 'Görev devredildi',   icon: '↔️', color: '#f97316' },
  status_changed:    { label: 'Statü değişti',      icon: '🔄', color: '#8b5cf6' },
  project_created:   { label: 'Görev Grubu oluşturuldu',  icon: '📁', color: '#10b981' },
  project_updated:   { label: 'Görev Grubu güncellendi',  icon: '📝', color: '#f59e0b' },
};

function getLogs() { try { return JSON.parse(localStorage.getItem(KEYS_STORE.activity)) || []; } catch { return []; } }

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'az önce';
  if (mins < 60)  return `${mins} dk önce`;
  if (hours < 24) return `${hours} sa önce`;
  return `${days} gün önce`;
}

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

export default function ActivityFeed() {
  const { getAllUsers } = useAuth();
  const allUsers = getAllUsers();
  const logs = getLogs();

  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (filterUser && log.userId !== filterUser) return false;
      if (filterAction && log.action !== filterAction) return false;
      if (search) {
        const user = allUsers.find(u => u.id === log.userId);
        const label = ACTION_LABELS[log.action]?.label || log.action;
        const combined = `${user?.name || ''} ${label} ${JSON.stringify(log.details)}`.toLowerCase();
        if (!combined.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [logs, filterUser, filterAction, search, allUsers]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Aktivite Akışı</h1>
          <p className="page-subtitle">Tüm sistem aktivitelerini takip edin</p>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'var(--surface-2)', padding: '4px 12px', borderRadius: 99, border: '1px solid var(--border)' }}>
          {filtered.length} kayıt
        </span>
      </div>

      {/* Filters */}
      <div className="board-filters" style={{ marginBottom: 20 }}>
        <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={14} className="search-icon" />
          <input className="search-input" placeholder="Ara…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
          <option value="">Tüm Kullanıcılar</option>
          {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select className="filter-select" value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">Tüm Eylemler</option>
          {ALL_ACTIONS.map(a => <option key={a} value={a}>{ACTION_LABELS[a].label}</option>)}
        </select>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <p style={{ color: 'var(--text-secondary)' }}>Aktivite kaydı bulunamadı.</p>
        </div>
      ) : (
        <div className="activity-feed">
          {filtered.map((log, i) => {
            const user = allUsers.find(u => u.id === log.userId);
            const cfg  = ACTION_LABELS[log.action] || { label: log.action, icon: '❓', color: '#6b7280' };
            const showDate = i === 0 || new Date(filtered[i - 1].timestamp).toDateString() !== new Date(log.timestamp).toDateString();

            return (
              <React.Fragment key={log.id}>
                {showDate && (
                  <div className="activity-date-separator">
                    {new Date(log.timestamp).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
                <div className="activity-item">
                  <div className="activity-icon" style={{ background: cfg.color + '22', color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <div className="activity-content">
                    <div className="activity-main">
                      <UserAvatar user={user} size={22} />
                      <span className="activity-user">{user?.name || 'Sistem'}</span>
                      <span className="activity-action">{cfg.label}</span>
                      {log.details?.title && (
                        <span className="activity-entity">"{log.details.title}"</span>
                      )}
                      {log.details?.name && !log.details?.title && (
                        <span className="activity-entity">"{log.details.name}"</span>
                      )}
                    </div>
                    {log.action === 'task_transferred' && (
                      <div className="activity-detail">
                        {(() => {
                          const from = allUsers.find(u => u.id === log.details?.fromUserId);
                          const to   = allUsers.find(u => u.id === log.details?.toUserId);
                          return `${from?.name || '?'} → ${to?.name || '?'}${log.details?.reason ? ` · "${log.details.reason}"` : ''}`;
                        })()}
                      </div>
                    )}
                    {log.action === 'status_changed' && (
                      <div className="activity-detail">
                        {log.details?.from} → {log.details?.to}
                      </div>
                    )}
                  </div>
                  <div className="activity-time" title={new Date(log.timestamp).toLocaleString('tr-TR')}>
                    {formatRelative(log.timestamp)}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
