import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, Zap, ShieldAlert, Copy, Check } from 'lucide-react';

const FIRST_RUN_KEY = 'aatools-first-run-secret';

export default function Login() {
  const { currentUser, login, changePassword } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'changePassword'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [firstRunSecret, setFirstRunSecret] = useState('');
  const [copied, setCopied] = useState(false);

  // Load the one-time first-run password if it exists
  useEffect(() => {
    const secret = localStorage.getItem(FIRST_RUN_KEY);
    if (secret) {
      setFirstRunSecret(secret);
      // Pre-fill the email for convenience
      setEmail('admin@aatools.com');
    }
  }, []);

  if (currentUser && !currentUser.mustChangePassword) {
    return <Navigate to="/" replace />;
  }

  if (currentUser && currentUser.mustChangePassword && mode !== 'changePassword') {
    setMode('changePassword');
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.user.mustChangePassword) {
      setMode('changePassword');
    } else {
      navigate('/');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    const result = await changePassword(newPassword);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setFirstRunSecret('');
    navigate('/');
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(firstRunSecret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="login-page">
      <div className="login-bg-orbs">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Zap size={28} />
          </div>
          <div>
            <div className="login-logo-title">AATools</div>
            <div className="login-logo-sub">Office Suite</div>
          </div>
        </div>

        {mode === 'login' ? (
          <>
            <div className="login-header">
              <h1 className="login-title">Hoş Geldiniz</h1>
              <p className="login-desc">Hesabınıza giriş yapın</p>
            </div>

            {/* First-run secret banner */}
            {firstRunSecret && (
              <div style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', fontWeight: 700, fontSize: 13 }}>
                  <ShieldAlert size={16} />
                  İlk Kurulum — Geçici Şifre
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Sistem ilk kez başlatıldı. Aşağıdaki tek kullanımlık şifre ile giriş yapın. Giriş sonrasında yeni şifrenizi belirlemeniz istenecek.
                </div>
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}>
                  <code style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2, color: '#f59e0b' }}>
                    {firstRunSecret}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    style={{
                      background: 'transparent', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                      fontSize: 12, color: 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Kopyalandı!' : 'Kopyala'}
                  </button>
                </div>
              </div>
            )}

            <form className="login-form" onSubmit={handleLogin}>
              <div className="login-field">
                <label className="login-label">E-posta</label>
                <div className="login-input-wrap">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    type="email"
                    className="login-input"
                    placeholder="ornek@sirket.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Şifre</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="login-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="login-eye-btn" onClick={() => setShowPass(p => !p)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="login-header">
              <h1 className="login-title">Şifrenizi Belirleyin</h1>
              <p className="login-desc">Güvenliğiniz için lütfen yeni bir şifre oluşturun.</p>
            </div>

            <form className="login-form" onSubmit={handleChangePassword}>
              <div className="login-field">
                <label className="login-label">Yeni Şifre</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="login-input"
                    placeholder="En az 8 karakter"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button type="button" className="login-eye-btn" onClick={() => setShowNew(p => !p)}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Şifreyi Tekrarlayın</label>
                <div className="login-input-wrap">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type="password"
                    className="login-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="login-submit-btn">
                Şifreyi Kaydet ve Devam Et
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
