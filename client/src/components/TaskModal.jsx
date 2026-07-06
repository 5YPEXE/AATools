import React, { useState, useEffect } from 'react';
import { X, Send, UserCheck, Clock, Calendar, Tag, Bug, Lightbulb, Wrench, TrendingUp, ArrowRightLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../context/AuthContext';
import { KEYS_STORE } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import UserAvatar from './UserAvatar';
import PriorityBadge from './PriorityBadge';
import StatusBadge, { STATUS_LIST, STATUS_LABELS } from './StatusBadge';

const TYPES = ['task', 'bug', 'feature', 'improvement'];
const TYPE_LABELS = { task: 'Görev', bug: 'Hata', feature: 'Özellik', improvement: 'İyileştirme' };
const TYPE_ICONS = {
  bug: <Bug size={13} />, feature: <Lightbulb size={13} />,
  task: <Wrench size={13} />, improvement: <TrendingUp size={13} />
};
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const PRIO_LABELS = { critical: 'Kritik', high: 'Yüksek', medium: 'Orta', low: 'Düşük' };

function getTasks() {
  try { return JSON.parse(localStorage.getItem(KEYS_STORE.tasks)) || []; }
  catch { return []; }
}
function saveTasks(tasks) {
  localStorage.setItem(KEYS_STORE.tasks, JSON.stringify(tasks));
}

export default function TaskModal({ task: initialTask, projectMembers, allUsers, onClose, onUpdate }) {
  const { currentUser, isLeader } = useAuth();
  const { addNotification } = useNotification();
  const [task, setTask] = useState(initialTask);
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(initialTask.title);
  const [editDesc, setEditDesc] = useState(false);
  const [descVal, setDescVal] = useState(initialTask.description || '');
  const [comment, setComment] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const assignee = allUsers.find(u => u.id === task.assigneeId);
  const reporter = allUsers.find(u => u.id === task.reporterId);

  const updateTask = (changes) => {
    const tasks = getTasks();
    const idx = tasks.findIndex(t => t.id === task.id);
    if (idx === -1) return;
    const updated = { ...tasks[idx], ...changes, updatedAt: new Date().toISOString() };
    tasks[idx] = updated;
    saveTasks(tasks);
    setTask(updated);
    onUpdate && onUpdate(updated);
    logActivity(currentUser.id, 'task_updated', 'task', task.id, changes);
  };

  const saveTitle = () => {
    if (titleVal.trim() && titleVal !== task.title) updateTask({ title: titleVal.trim() });
    setEditTitle(false);
  };

  const saveDesc = () => {
    if (descVal !== task.description) updateTask({ description: descVal });
    setEditDesc(false);
  };

  const handleStatusChange = (s) => {
    const extra = s === 'done' ? { completedAt: new Date().toISOString() } : {};
    updateTask({ status: s, ...extra });
    logActivity(currentUser.id, 'status_changed', 'task', task.id, { from: task.status, to: s });
  };

  const handleAssignee = (uid) => {
    updateTask({ assigneeId: uid });
    logActivity(currentUser.id, 'task_assigned', 'task', task.id, { assigneeId: uid });
    if (uid && uid !== currentUser.id) {
      addNotification(uid, `"${task.title}" görevi size atandı.`, {
        title: 'Görev Ataması',
        type: 'info'
      });
    }
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    const newComment = {
      id: `cmt-${Date.now()}`,
      userId: currentUser.id,
      text: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    updateTask({ comments: [...(task.comments || []), newComment] });
    setComment('');
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    if (!transferTo) return;
    const entry = {
      fromUserId: task.assigneeId,
      toUserId: transferTo,
      reason: transferReason,
      at: new Date().toISOString(),
    };
    updateTask({
      assigneeId: transferTo,
      transferHistory: [...(task.transferHistory || []), entry],
    });

    if (transferTo !== currentUser.id) {
      addNotification(transferTo, `"${task.title}" görevi size devredildi.`, {
        title: 'Görev Devri',
        type: 'warning'
      });
    }

    logActivity(currentUser.id, 'task_transferred', 'task', task.id, entry);
    setShowTransfer(false);
    setTransferTo('');
    setTransferReason('');
  };

  // close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const canEdit = isLeader || currentUser.id === task.assigneeId || currentUser.id === task.reporterId;
  const transferableUsers = projectMembers.filter(u => u.id !== task.assigneeId && u.isActive);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="task-modal">
        {/* Top bar */}
        <div className="task-modal-topbar">
          <div className="task-modal-type-row">
            {TYPE_ICONS[task.type]}
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {TYPE_LABELS[task.type]}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {task.issueKey ? `#${task.issueKey}` : `#${task.id.slice(-6)}`}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="task-modal-body">
          {/* Left: Main content */}
          <div className="task-modal-left">
            {/* Title */}
            {editTitle ? (
              <div className="task-modal-edit-title">
                <input
                  className="task-modal-title-input"
                  value={titleVal}
                  onChange={e => setTitleVal(e.target.value)}
                  autoFocus
                  onBlur={saveTitle}
                  onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditTitle(false); }}
                />
              </div>
            ) : (
              <h2
                className="task-modal-title"
                onClick={() => canEdit && setEditTitle(true)}
                title={canEdit ? 'Düzenlemek için tıkla' : ''}
                style={{ cursor: canEdit ? 'text' : 'default' }}
              >
                {task.title}
              </h2>
            )}

            {/* Description */}
            <div className="task-modal-section">
              <div className="task-modal-section-label">Açıklama</div>
              {editDesc ? (
                <div>
                  <textarea
                    className="task-modal-desc-input"
                    value={descVal}
                    onChange={e => setDescVal(e.target.value)}
                    autoFocus
                    rows={5}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button className="btn-sm btn-primary" onClick={saveDesc}>Kaydet</button>
                    <button className="btn-sm btn-ghost" onClick={() => setEditDesc(false)}>İptal</button>
                  </div>
                </div>
              ) : (
                <div
                  className={`task-modal-desc ${!task.description ? 'empty' : ''}`}
                  onClick={() => canEdit && setEditDesc(true)}
                  style={{ cursor: canEdit ? 'text' : 'default' }}
                >
                  {task.description || (canEdit ? 'Açıklama eklemek için tıkla…' : 'Açıklama yok.')}
                </div>
              )}
            </div>

            {/* Transfer History */}
            {task.transferHistory?.length > 0 && (
              <div className="task-modal-section">
                <div className="task-modal-section-label">Devir Geçmişi</div>
                <div className="transfer-history">
                  {task.transferHistory.map((t, i) => {
                    const from = allUsers.find(u => u.id === t.fromUserId);
                    const to   = allUsers.find(u => u.id === t.toUserId);
                    return (
                      <div key={i} className="transfer-entry">
                        <ArrowRightLeft size={13} style={{ color: 'var(--accent)' }} />
                        <span>
                          <strong>{from?.name || '?'}</strong> → <strong>{to?.name || '?'}</strong>
                          {t.reason && <em style={{ color: 'var(--text-tertiary)' }}> &quot;{t.reason}&quot;</em>}
                        </span>
                        <span className="transfer-date">
                          {new Date(t.at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="task-modal-section">
              <div className="task-modal-section-label">Yorumlar ({task.comments?.length || 0})</div>
              <div className="comments-list">
                {(task.comments || []).map(c => {
                  const author = allUsers.find(u => u.id === c.userId);
                  return (
                    <div key={c.id} className="comment-item">
                      <UserAvatar user={author} size={28} />
                      <div className="comment-bubble">
                        <div className="comment-meta">
                          <strong>{author?.name || 'Bilinmiyor'}</strong>
                          <span>{new Date(c.createdAt).toLocaleString('tr-TR')}</span>
                        </div>
                        <p>{c.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form className="comment-form" onSubmit={handleComment}>
                <UserAvatar user={currentUser} size={28} />
                <div className="comment-input-wrap">
                  <input
                    className="comment-input"
                    placeholder="Yorum yaz…"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />
                  <button type="submit" className="comment-send-btn" disabled={!comment.trim()}>
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="task-modal-sidebar">
            {/* Status */}
            <div className="sidebar-field">
              <div className="sidebar-field-label">Statü</div>
              <select
                className="sidebar-select"
                value={task.status}
                onChange={e => handleStatusChange(e.target.value)}
                disabled={!canEdit}
              >
                {STATUS_LIST.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="sidebar-field">
              <div className="sidebar-field-label">Öncelik</div>
              {isLeader ? (
                <select
                  className="sidebar-select"
                  value={task.priority}
                  onChange={e => updateTask({ priority: e.target.value })}
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{PRIO_LABELS[p]}</option>
                  ))}
                </select>
              ) : (
                <PriorityBadge priority={task.priority} />
              )}
            </div>

            {/* Type */}
            <div className="sidebar-field">
              <div className="sidebar-field-label">Tür</div>
              {isLeader ? (
                <select
                  className="sidebar-select"
                  value={task.type}
                  onChange={e => updateTask({ type: e.target.value })}
                >
                  {TYPES.map(tp => (
                    <option key={tp} value={tp}>{TYPE_LABELS[tp]}</option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize: 13 }}>{TYPE_LABELS[task.type]}</span>
              )}
            </div>

            {/* Assignee */}
            <div className="sidebar-field">
              <div className="sidebar-field-label">Atanan</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {assignee ? <UserAvatar user={assignee} size={24} showName /> : <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Atanmamış</span>}
              </div>
              {isLeader && (
                <select
                  className="sidebar-select"
                  value={task.assigneeId || ''}
                  onChange={e => handleAssignee(e.target.value)}
                  style={{ marginTop: 6 }}
                >
                  <option value="">Atanmamış</option>
                  {projectMembers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Reporter */}
            <div className="sidebar-field">
              <div className="sidebar-field-label">Oluşturan</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {reporter ? <UserAvatar user={reporter} size={24} showName /> : <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>?</span>}
              </div>
            </div>

            {/* Due Date */}
            <div className="sidebar-field">
              <div className="sidebar-field-label">Bitiş Tarihi</div>
              {isLeader ? (
                <input
                  type="date"
                  className="sidebar-select"
                  value={task.dueDate || ''}
                  onChange={e => updateTask({ dueDate: e.target.value || null })}
                />
              ) : (
                <span style={{ fontSize: 13 }}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : '—'}
                </span>
              )}
            </div>

            {/* Created At */}
            <div className="sidebar-field">
              <div className="sidebar-field-label">Oluşturulma</div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {new Date(task.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>

            {/* Transfer Button */}
            {isLeader && transferableUsers.length > 0 && (
              <div className="sidebar-field" style={{ marginTop: 8 }}>
                <button className="btn-sm btn-transfer" onClick={() => setShowTransfer(s => !s)}>
                  <ArrowRightLeft size={13} /> Devret
                </button>

                {showTransfer && (
                  <form className="transfer-form" onSubmit={handleTransfer}>
                    <div className="sidebar-field-label" style={{ marginTop: 10 }}>Kime?</div>
                    <select
                      className="sidebar-select"
                      value={transferTo}
                      onChange={e => setTransferTo(e.target.value)}
                      required
                    >
                      <option value="">Seçin…</option>
                      {transferableUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <div className="sidebar-field-label" style={{ marginTop: 8 }}>Neden? (opsiyonel)</div>
                    <input
                      className="sidebar-select"
                      placeholder="Devir nedeni…"
                      value={transferReason}
                      onChange={e => setTransferReason(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button type="submit" className="btn-sm btn-primary">Onayla</button>
                      <button type="button" className="btn-sm btn-ghost" onClick={() => setShowTransfer(false)}>İptal</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
