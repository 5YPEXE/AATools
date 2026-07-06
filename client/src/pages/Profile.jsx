import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { User, Camera, Lock, Check } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

export default function Profile() {
  const { currentUser, updateUser, changePassword } = useAuth();
  const { showNotification } = useNotification();

  const [name, setName] = useState(currentUser?.name || '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const handleNameUpdate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateUser(currentUser.id, { name: name.trim() });
    showNotification('success', 'Profil güncellendi');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      showNotification('error', 'Dosya boyutu 2MB dan küçük olmalıdır.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      updateUser(currentUser.id, { avatarBase64: base64 });
      showNotification('success', 'Profil fotoğrafı güncellendi');
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      showNotification('error', 'Şifreler eşleşmiyor!');
      return;
    }
    if (password.length < 6) {
      showNotification('error', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }
    const res = await changePassword(password);
    if (res.success) {
      showNotification('success', 'Şifreniz başarıyla değiştirildi.');
      setPassword('');
      setPasswordConfirm('');
    } else {
      showNotification('error', res.error || 'Şifre değiştirilemedi.');
    }
  };

  if (!currentUser) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
        <div className="sidebar-logo-icon" style={{ 
          width: '36px', height: '36px', borderRadius: '8px', 
          background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)', 
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <User size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>Profil Ayarları</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Kişisel bilgilerinizi, profil fotoğrafınızı ve şifrenizi güncelleyin.
          </p>
        </div>
      </div>

      <div className="tool-panel-grid" style={{ gridTemplateColumns: '300px 1fr', alignItems: 'start' }}>
        {/* Sol Kolon: Avatar ve Bilgiler */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', background: 'var(--bg-card)', padding: '32px 20px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ position: 'relative' }}>
            <UserAvatar user={currentUser} size={120} />
            <label 
              htmlFor="avatar-upload" 
              style={{
                position: 'absolute', bottom: 4, right: 4,
                background: 'var(--accent)', color: '#fff',
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
              title="Fotoğraf Yükle"
            >
              <Camera size={16} />
            </label>
            <input 
              type="file" 
              id="avatar-upload" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleAvatarUpload} 
            />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.name}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{currentUser.email}</p>
            <div className="role-badge-sm" style={{ marginTop: '12px', display: 'inline-block' }}>
              {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'leader' ? 'Takım Lideri' : 'Kullanıcı'}
            </div>
            {currentUser.team && (
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                Takım: {currentUser.team}
              </div>
            )}
          </div>
        </div>

        {/* Sağ Kolon: Formlar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="chart-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Kişisel Bilgiler</h3>
            <form onSubmit={handleNameUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Ad Soyad</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="search-input" 
                  style={{ width: '100%', maxWidth: '400px' }} 
                  placeholder="Adınızı girin"
                />
              </div>
              <div>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} /> Kaydet
                </button>
              </div>
            </form>
          </div>

          <div className="chart-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Şifre Değiştir</h3>
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Yeni Şifre</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="search-input" 
                  style={{ width: '100%', maxWidth: '400px' }} 
                  placeholder="En az 6 karakter"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Yeni Şifre (Tekrar)</label>
                <input 
                  type="password" 
                  value={passwordConfirm} 
                  onChange={e => setPasswordConfirm(e.target.value)} 
                  className="search-input" 
                  style={{ width: '100%', maxWidth: '400px' }} 
                  placeholder="Şifreyi onaylayın"
                />
              </div>
              <div>
                <button type="submit" className="btn btn-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: (password && passwordConfirm) ? 1 : 0.5 }} disabled={!password || !passwordConfirm}>
                  <Lock size={16} /> Şifreyi Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
