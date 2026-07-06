import React, { useState } from 'react';
import { UserPlus, Edit2, UserX, UserCheck, Shield, Users, Search, Key, Copy, Check } from 'lucide-react';
import { useAuth, TEAMS } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';

const ROLES = [
  { id: 'admin',  label: 'Admin',         color: '#ef4444' },
  { id: 'leader', label: 'Takım Lideri',  color: '#f97316' },
  { id: 'member', label: 'Kullanıcı',     color: '#6366f1' },
];

export default function UserManagement() {
  const { currentUser, getAllUsers, register, updateUser } = useAuth();
  const [users, setUsers] = useState(getAllUsers);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member', team: '', title: '' });
  const [formError, setFormError] = useState('');
  const [resetModal, setResetModal] = useState(null); // { name, password }
  const [copied, setCopied] = useState(false);

  const refresh = () => setUsers(getAllUsers());

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'member', team: '', title: '' });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, team: user.team || '', title: user.title || '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (editUser) {
      const updates = { name: form.name.trim(), role: form.role, team: form.team?.trim(), title: form.title?.trim() };
      updateUser(editUser.id, updates);
      refresh();
      setShowModal(false);
    } else {
      if (!form.password || form.password.length < 8) {
        setFormError('Şifre en az 8 karakter olmalıdır.');
        return;
      }
      const result = await register(form.name.trim(), form.email.trim(), form.password, form.role, form.team, form.title);
      if (!result.success) { setFormError(result.error); return; }
      refresh();
      setShowModal(false);
    }
  };

  const toggleActive = (user) => {
    if (user.id === currentUser.id) return; // Can't deactivate self
    updateUser(user.id, { isActive: !user.isActive });
    refresh();
  };

  const resetPassword = async (user) => {
    const tempPass = 'Passw0rd!';
    const { hashPassword } = await import('../context/AuthContext');
    const hash = await hashPassword(user.email, tempPass);
    await updateUser(user.id, { passwordHash: hash, mustChangePassword: true });
    setResetModal({ name: user.name, password: tempPass });
    setCopied(false);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(resetModal.password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kullanıcı Yönetimi</h1>
          <p className="page-subtitle">Ekip üyelerini yönetin, roller atayın</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <UserPlus size={15} /> Kullanıcı Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ marginBottom: 24 }}>
        {ROLES.map(r => {
          const count = users.filter(u => u.role === r.id && u.isActive).length;
          return (
            <div key={r.id} className="stat-chip" style={{ borderLeft: `3px solid ${r.color}` }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: r.color }}>{count}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.label}</span>
            </div>
          );
        })}
        <div className="stat-chip" style={{ borderLeft: '3px solid #6b7280' }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-secondary)' }}>
            {users.filter(u => !u.isActive).length}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Pasif</span>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 18 }}>
        <Search size={16} className="search-icon" />
        <input
          className="search-input"
          placeholder="Ad veya e-posta ile ara…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* User Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>E-posta</th>
              <th>Unvan / Ekip</th>
              <th>Rol</th>
              <th>Durum</th>
              <th>Kayıt Tarihi</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => {
              const role = ROLES.find(r => r.id === user.role);
              const isSelf = user.id === currentUser.id;
              return (
                <tr key={user.id} className={!user.isActive ? 'row-disabled' : ''}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <UserAvatar user={user} size={32} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                        {isSelf && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Siz</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.email}</td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{user.title || '-'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user.team || 'Ekip yok'}</div>
                  </td>
                  <td>
                    <span
                      className="role-badge"
                      style={{ background: role?.color + '22', color: role?.color, border: `1px solid ${role?.color}44` }}
                    >
                      {role?.label || user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="icon-btn" onClick={() => openEdit(user)} title="Düzenle">
                        <Edit2 size={14} />
                      </button>
                      {!isSelf && (
                        <button
                          className="icon-btn"
                          onClick={() => toggleActive(user)}
                          title={user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                        >
                          {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      )}
                      <button className="icon-btn" onClick={() => resetPassword(user)} title="Şifre Sıfırla">
                        <Key size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div className="modal-card-header">
              <h3>{editUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <label className="form-label">Ad Soyad *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ad Soyad"
                  required
                  autoFocus
                />
              </div>

              {!editUser && (
                <>
                  <div className="form-row">
                    <label className="form-label">E-posta *</label>
                    <input
                      type="email"
                      className="form-input"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="kullanici@sirket.com"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <label className="form-label">Şifre *</label>
                    <input
                      type="password"
                      className="form-input"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="En az 8 karakter"
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label">Unvan</label>
                  <input
                    className="form-input"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Örn: Frontend Developer"
                  />
                </div>
                <div>
                  <label className="form-label">Ekip</label>
                  <select
                    className="form-input"
                    value={form.team || ''}
                    onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
                  >
                    <option value="">Ekip Seçin...</option>
                    {TEAMS.map(t => (
                      <option key={t.id} value={t.label}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <label className="form-label">Rol</label>
                <div className="role-selector">
                  {ROLES.map(r => (
                    <label key={r.id} className={`role-option${form.role === r.id ? ' selected' : ''}`} style={{ '--role-color': r.color }}>
                      <input type="radio" name="role" value={r.id} checked={form.role === r.id} onChange={() => setForm(f => ({ ...f, role: r.id }))} />
                      <span style={{ fontWeight: 600, color: form.role === r.id ? r.color : 'var(--text-secondary)' }}>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formError && <div className="login-error">{formError}</div>}

              <div className="modal-form-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
                <button type="submit" className="btn-primary">
                  {editUser ? 'Güncelle' : 'Kullanıcı Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Reset Password Modal */}
      {resetModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setResetModal(null)}>
          <div className="modal-card" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div className="modal-card-header">
              <h3>Şifre Sıfırlandı</h3>
              <button className="modal-close-btn" onClick={() => setResetModal(null)}>✕</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                <strong>{resetModal.name}</strong> için geçici şifre oluşturuldu. Kullanıcı bir sonraki girişte şifresini değiştirmek zorunda kalacak.
              </div>
              <div style={{
                background: 'var(--bg-hover)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 20px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between', gap: 12,
                marginBottom: 20,
              }}>
                <code style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: 'var(--accent)' }}>
                  {resetModal.password}
                </code>
                <button
                  className="btn-ghost"
                  onClick={handleCopyPassword}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Kopyalandı!' : 'Kopyala'}
                </button>
              </div>
              <button className="btn-primary" style={{ width: '100%' }} onClick={() => setResetModal(null)}>Tamam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
