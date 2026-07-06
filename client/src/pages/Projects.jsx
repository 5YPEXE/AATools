import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Archive, Users, CheckSquare, MoreHorizontal, Folder, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KEYS_STORE } from '../context/AuthContext';
import { logActivity } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';

const PROJECT_COLORS = [
  '#6366f1', '#2563eb', '#10b981', '#f97316', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#14b8a6',
];
const PROJECT_ICONS = ['📋', '🚀', '🛠️', '📊', '🎯', '💡', '🔧', '📁', '⚡', '🌟'];

function getProjects() {
  try { return JSON.parse(localStorage.getItem(KEYS_STORE.projects)) || []; }
  catch { return []; }
}
function saveProjects(p) { localStorage.setItem(KEYS_STORE.projects, JSON.stringify(p)); }

function getTasks() {
  try { return JSON.parse(localStorage.getItem(KEYS_STORE.tasks)) || []; }
  catch { return []; }
}

export default function Projects() {
  const { currentUser, isLeader, isAdmin, getAllUsers } = useAuth();
  const navigate = useNavigate();
  const allUsers = getAllUsers();

  const [projects, setProjects] = useState(getProjects);
  const [tasks] = useState(getTasks);
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);

  // Form state
  const [form, setForm] = useState({ title: '', description: '', color: PROJECT_COLORS[0], icon: PROJECT_ICONS[0], members: [] });

  const openCreateModal = () => {
    setEditProject(null);
    setForm({ title: '', description: '', color: PROJECT_COLORS[0], icon: PROJECT_ICONS[0], members: [currentUser.id] });
    setShowModal(true);
  };

  const openEditModal = (proj) => {
    setEditProject(proj);
    setForm({ title: proj.title, description: proj.description || '', color: proj.color, icon: proj.icon, members: proj.members });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    let updated;
    if (editProject) {
      updated = projects.map(p => p.id === editProject.id ? { ...p, ...form } : p);
      logActivity(currentUser.id, 'project_updated', 'project', editProject.id, { title: form.title });
    } else {
      const newProj = {
        id: `proj-${Date.now()}`,
        title: form.title.trim(),
        description: form.description.trim(),
        color: form.color,
        icon: form.icon,
        createdBy: currentUser.id,
        members: form.members.includes(currentUser.id) ? form.members : [...form.members, currentUser.id],
        createdAt: new Date().toISOString(),
        isArchived: false,
      };
      updated = [...projects, newProj];
      logActivity(currentUser.id, 'project_created', 'project', newProj.id, { title: newProj.title });
    }
    saveProjects(updated);
    setProjects(updated);
    setShowModal(false);
  };

  const toggleArchive = (projId) => {
    const updated = projects.map(p => p.id === projId ? { ...p, isArchived: !p.isArchived } : p);
    saveProjects(updated);
    setProjects(updated);
  };

  const toggleMember = (uid) => {
    setForm(f => ({
      ...f,
      members: f.members.includes(uid) ? f.members.filter(m => m !== uid) : [...f.members, uid],
    }));
  };

  // Filter visible projects for current user
  const visibleProjects = useMemo(() => {
    return projects.filter(p => {
      if (!showArchived && p.isArchived) return false;
      if (!isAdmin && !p.members.includes(currentUser.id)) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [projects, showArchived, isAdmin, currentUser.id, search]);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Panolar</h1>
          <p className="page-subtitle">Tüm panoları yönetin ve görevlerinizi organize edin</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn-ghost-sm"
            onClick={() => setShowArchived(s => !s)}
            style={{ fontSize: 13 }}
          >
            <Archive size={14} /> {showArchived ? 'Arşivi Gizle' : 'Arşivi Göster'}
          </button>
          {isLeader && (
            <button className="btn-primary" onClick={openCreateModal}>
              <Plus size={15} /> Yeni Pano
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 24 }}>
        <Search size={16} className="search-icon" />
        <input
          className="search-input"
          placeholder="Pano ara…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {visibleProjects.length === 0 ? (
        <div className="empty-state">
          <Folder size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-secondary)' }}>Henüz pano yok.</p>
          {isLeader && (
            <button className="btn-primary" onClick={openCreateModal} style={{ marginTop: 12 }}>
              <Plus size={15} /> İlk panoyu oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {visibleProjects.map(proj => {
            const openTasks = tasks.filter(t => t.projectId === proj.id && t.status !== 'done').length;
            const doneTasks = tasks.filter(t => t.projectId === proj.id && t.status === 'done').length;
            const totalTasks = openTasks + doneTasks;
            const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
            const memberUsers = proj.members.map(id => allUsers.find(u => u.id === id)).filter(Boolean);

            return (
              <div
                key={proj.id}
                className={`project-card${proj.isArchived ? ' archived' : ''}`}
                onClick={() => !proj.isArchived && navigate(`/projects/${proj.id}/board`)}
                style={{ '--proj-color': proj.color, cursor: proj.isArchived ? 'default' : 'pointer' }}
              >
                <div className="project-card-accent" style={{ background: proj.color }} />
                <div className="project-card-body">
                  <div className="project-card-header">
                    <div className="project-icon">{proj.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="project-card-title">{proj.title}</div>
                      {proj.isArchived && <span className="archived-badge">Arşiv</span>}
                    </div>
                    {isLeader && (
                      <div className="project-card-actions" onClick={e => e.stopPropagation()}>
                        <button className="icon-btn" onClick={() => openEditModal(proj)} title="Düzenle">✏️</button>
                        <button className="icon-btn" onClick={() => toggleArchive(proj.id)} title={proj.isArchived ? 'Geri Al' : 'Arşivle'}>
                          {proj.isArchived ? '📤' : '📥'}
                        </button>
                      </div>
                    )}
                  </div>

                  {proj.description && (
                    <p className="project-card-desc">{proj.description}</p>
                  )}

                  {/* Progress */}
                  <div className="project-progress">
                    <div className="project-progress-bar">
                      <div
                        className="project-progress-fill"
                        style={{ width: `${progress}%`, background: proj.color }}
                      />
                    </div>
                    <span className="project-progress-label">{progress}%</span>
                  </div>

                  {/* Footer */}
                  <div className="project-card-footer">
                    <div className="project-stats">
                      <CheckSquare size={13} style={{ color: 'var(--text-tertiary)' }} />
                      <span>{doneTasks}/{totalTasks} görev</span>
                    </div>
                    <div className="project-members">
                      {memberUsers.slice(0, 4).map(u => (
                        <UserAvatar key={u.id} user={u} size={24} />
                      ))}
                      {memberUsers.length > 4 && (
                        <div className="member-more">+{memberUsers.length - 4}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-card" style={{ maxWidth: 560 }}>
            <div className="modal-card-header">
              <h3>{editProject ? 'Panoyu Düzenle' : 'Yeni Pano'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <label className="form-label">Pano Adı *</label>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Pano adını girin…"
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <label className="form-label">Açıklama</label>
                <textarea
                  className="form-input"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Kısa bir açıklama…"
                  rows={2}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-row">
                  <label className="form-label">Renk</label>
                  <div className="color-picker">
                    {PROJECT_COLORS.map(c => (
                      <button
                        key={c} type="button"
                        className={`color-dot${form.color === c ? ' selected' : ''}`}
                        style={{ background: c }}
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <label className="form-label">İkon</label>
                  <div className="icon-picker">
                    {PROJECT_ICONS.map(ic => (
                      <button
                        key={ic} type="button"
                        className={`icon-opt${form.icon === ic ? ' selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <label className="form-label">Üyeler</label>
                <div className="member-select-list">
                  {allUsers.filter(u => u.isActive).map(u => (
                    <label key={u.id} className="member-select-item">
                      <input
                        type="checkbox"
                        checked={form.members.includes(u.id)}
                        onChange={() => toggleMember(u.id)}
                        disabled={u.id === currentUser.id}
                      />
                      <UserAvatar user={u} size={24} />
                      <span>{u.name}</span>
                      <span className="role-badge-sm">{u.role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-form-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn-primary">
                  {editProject ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
