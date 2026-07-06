import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List, Filter, Search, ArrowLeft, Bug, Lightbulb, Wrench, TrendingUp, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KEYS_STORE, logActivity, TEAMS } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import UserAvatar from '../components/UserAvatar';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge, { STATUS_LIST, STATUS_LABELS } from '../components/StatusBadge';

const TYPES = ['task', 'bug', 'feature', 'improvement'];
const TYPE_LABELS = { task: 'Görev', bug: 'Hata', feature: 'Özellik', improvement: 'İyileştirme' };
const TYPE_ICONS = { bug: <Bug size={12} />, feature: <Lightbulb size={12} />, task: <Wrench size={12} />, improvement: <TrendingUp size={12} /> };
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const PRIO_LABELS = { critical: 'Kritik', high: 'Yüksek', medium: 'Orta', low: 'Düşük' };

function getProjects() { try { return JSON.parse(localStorage.getItem(KEYS_STORE.projects)) || []; } catch { return []; } }
function getAllTasks() { try { return JSON.parse(localStorage.getItem(KEYS_STORE.tasks)) || []; } catch { return []; } }
function saveTasks(tasks) { localStorage.setItem(KEYS_STORE.tasks, JSON.stringify(tasks)); }

export default function ProjectBoard() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isLeader, getAllUsers } = useAuth();
  const { addNotification } = useNotification();
  const allUsers = getAllUsers();

  const project = getProjects().find(p => p.id === projectId);
  const [tasks, setTasks] = useState(getAllTasks);
  const [view, setView] = useState('kanban'); // 'kanban' | 'list'
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStatus, setCreateStatus] = useState('todo');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  // Filters
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');

  // New task form
  const [newTask, setNewTask] = useState({ title: '', description: '', type: 'task', priority: 'medium', assigneeId: '', dueDate: '' });

  if (!project) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Proje bulunamadı.</p>
          <button className="btn-primary" onClick={() => navigate('/projects')}>Projelere Dön</button>
        </div>
      </div>
    );
  }

  // Member access check
  const isMember = project.members.includes(currentUser.id);
  if (!isMember && currentUser.role !== 'admin') {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p>Bu projeye erişim yetkiniz yok.</p>
          <button className="btn-primary" onClick={() => navigate('/projects')}>Projelere Dön</button>
        </div>
      </div>
    );
  }

  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const projectMembers = project.members.map(id => allUsers.find(u => u.id === id)).filter(Boolean);

  const filteredTasks = useMemo(() => {
    return projectTasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterAssignee && t.assigneeId !== filterAssignee) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterType && t.type !== filterType) return false;
      return true;
    });
  }, [projectTasks, search, filterAssignee, filterPriority, filterType]);

  const sortedListTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let valA = a[sortBy], valB = b[sortBy];
      if (!valA) return 1; if (!valB) return -1;
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortBy, sortDir]);

  const handleStatusChange = useCallback((taskId, newStatus) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id !== taskId) return t;
        const changes = { status: newStatus, updatedAt: new Date().toISOString() };
        if (newStatus === 'done') changes.completedAt = new Date().toISOString();
        return { ...t, ...changes };
      });
      saveTasks(updated);
      logActivity(currentUser.id, 'status_changed', 'task', taskId, { to: newStatus });
      return updated;
    });
  }, [currentUser.id]);

  const handleTaskUpdate = useCallback((updated) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === updated.id ? updated : t);
      saveTasks(next);
      return next;
    });
    setSelectedTask(updated);
  }, []);

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    let assigneeTeam = null;
    if (newTask.assigneeId) {
      const u = allUsers.find(x => x.id === newTask.assigneeId);
      assigneeTeam = u?.team;
    }
    const teamDef = TEAMS.find(t => t.label === assigneeTeam) || { prefix: 'ANK-GEN' };
    const prefix = teamDef.prefix;
    const seqKey = `aatools-task-seq-${prefix}`;
    let seq = parseInt(localStorage.getItem(seqKey) || '0', 10) + 1;
    localStorage.setItem(seqKey, seq.toString());
    const issueKey = `${prefix}-${seq.toString().padStart(3, '0')}`;

    const task = {
      id: `task-${Date.now()}`,
      issueKey,
      projectId,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      status: createStatus,
      priority: newTask.priority,
      type: newTask.type,
      assigneeId: newTask.assigneeId || null,
      reporterId: currentUser.id,
      transferHistory: [],
      labels: [],
      dueDate: newTask.dueDate || null,
      estimatedHours: null,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    };
    setTasks(prev => {
      const next = [...prev, task];
      saveTasks(next);
      return next;
    });
    logActivity(currentUser.id, 'task_created', 'task', task.id, { title: task.title, projectId });
    
    // Notification for assignee
    if (task.assigneeId && task.assigneeId !== currentUser.id) {
      addNotification(task.assigneeId, `"${task.title}" görevi size atandı.`, {
        title: 'Yeni Görev Ataması',
        type: 'info'
      });
    }

    setShowCreateModal(false);
    setNewTask({ title: '', description: '', type: 'task', priority: 'medium', assigneeId: '', dueDate: '' });
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => sortBy === col
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : null;

  return (
    <div className="page-container" style={{ maxWidth: '100%' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-ghost-sm" onClick={() => navigate('/projects')}>
            <ArrowLeft size={14} />
          </button>
          <div className="project-icon" style={{ background: project.color + '22', border: `1.5px solid ${project.color}33` }}>
            {project.icon}
          </div>
          <div>
            <h1 className="page-title" style={{ marginBottom: 0 }}>{project.title}</h1>
            {project.description && <p className="page-subtitle" style={{ marginTop: 2 }}>{project.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Member avatars */}
          <div style={{ display: 'flex', gap: -4 }}>
            {projectMembers.slice(0, 5).map(u => (
              <UserAvatar key={u.id} user={u} size={28} style={{ marginLeft: -4 }} />
            ))}
          </div>
          {/* View toggle */}
          <div className="view-toggle">
            <button className={`view-toggle-btn${view === 'kanban' ? ' active' : ''}`} onClick={() => setView('kanban')}>
              <LayoutGrid size={14} /> Kanban
            </button>
            <button className={`view-toggle-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}>
              <List size={14} /> Liste
            </button>
          </div>
          {isLeader && (
            <button className="btn-primary" onClick={() => { setCreateStatus('todo'); setShowCreateModal(true); }}>
              <Plus size={15} /> Görev Ekle
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="board-filters">
        <div className="search-bar" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={14} className="search-icon" />
          <input className="search-input" placeholder="Görev ara…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
          <option value="">Tüm Kişiler</option>
          {projectMembers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select className="filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">Tüm Öncelikler</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{PRIO_LABELS[p]}</option>)}
        </select>
        <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tüm Türler</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      {/* Board / List */}
      {view === 'kanban' ? (
        <KanbanBoard
          tasks={filteredTasks}
          allUsers={allUsers}
          onTaskClick={task => setSelectedTask(task)}
          onStatusChange={handleStatusChange}
          onAddTask={col => { setCreateStatus(col); setShowCreateModal(true); }}
          isLeader={isLeader}
        />
      ) : (
        <div className="task-list-table-wrap">
          <table className="task-list-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('title')} style={{ cursor: 'pointer' }}>
                  Başlık <SortIcon col="title" />
                </th>
                <th>Tür</th>
                <th onClick={() => toggleSort('priority')} style={{ cursor: 'pointer' }}>
                  Öncelik <SortIcon col="priority" />
                </th>
                <th>Atanan</th>
                <th onClick={() => toggleSort('dueDate')} style={{ cursor: 'pointer' }}>
                  Bitiş <SortIcon col="dueDate" />
                </th>
                <th onClick={() => toggleSort('status')} style={{ cursor: 'pointer' }}>
                  Statü <SortIcon col="status" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedListTasks.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>Görev bulunamadı.</td></tr>
              )}
              {sortedListTasks.map(task => {
                const assignee = allUsers.find(u => u.id === task.assigneeId);
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                return (
                  <tr key={task.id} onClick={() => setSelectedTask(task)} className="task-list-row">
                    <td>
                      <span className="task-list-title">{task.title}</span>
                    </td>
                    <td>
                      <span className="task-type-chip">
                        {TYPE_ICONS[task.type]} {TYPE_LABELS[task.type]}
                      </span>
                    </td>
                    <td><PriorityBadge priority={task.priority} /></td>
                    <td>
                      {assignee ? <UserAvatar user={assignee} size={24} showName /> : <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>—</span>}
                    </td>
                    <td>
                      <span className={isOverdue ? 'overdue-text' : ''} style={{ fontSize: 12 }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : '—'}
                      </span>
                    </td>
                    <td><StatusBadge status={task.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          projectMembers={projectMembers}
          allUsers={allUsers}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
        />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="modal-card" style={{ maxWidth: 520 }}>
            <div className="modal-card-header">
              <h3>Yeni Görev Oluştur</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask} className="modal-form">
              <div className="form-row">
                <label className="form-label">Başlık *</label>
                <input
                  className="form-input"
                  value={newTask.title}
                  onChange={e => setNewTask(f => ({ ...f, title: e.target.value }))}
                  placeholder="Görev başlığı…"
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-input"
                  value={newTask.description}
                  onChange={e => setNewTask(f => ({ ...f, description: e.target.value }))}
                  placeholder="Görev açıklaması…"
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-row">
                  <label className="form-label">Tür</label>
                  <select className="form-input" value={newTask.type} onChange={e => setNewTask(f => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label className="form-label">Öncelik</label>
                  <select className="form-input" value={newTask.priority} onChange={e => setNewTask(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{PRIO_LABELS[p]}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-row">
                  <label className="form-label">Atanan Kişi</label>
                  <select className="form-input" value={newTask.assigneeId} onChange={e => setNewTask(f => ({ ...f, assigneeId: e.target.value }))}>
                    <option value="">Seçin…</option>
                    {projectMembers.filter(u => u.isActive).map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label className="form-label">Bitiş Tarihi</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newTask.dueDate}
                    onChange={e => setNewTask(f => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <label className="form-label">Başlangıç Statüsü</label>
                <select className="form-input" value={createStatus} onChange={e => setCreateStatus(e.target.value)}>
                  {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>

              <div className="modal-form-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowCreateModal(false)}>İptal</button>
                <button type="submit" className="btn-primary"><Plus size={14} /> Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
