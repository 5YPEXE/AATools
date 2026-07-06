import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Map, Bus, MapPin, CreditCard, Building2, Zap, 
  FileSpreadsheet, Database, Terminal, Columns, Sparkles, RefreshCw, 
  FileText, ListTodo, ChevronDown, Sun, Moon, FolderKanban,
  Users, BarChart3, Activity, LogOut, UserCog, ChevronUp, Wand2, Bell, Shield, User
} from 'lucide-react';
import { t, LANGUAGES } from './i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserAvatar from './components/UserAvatar';
import Dashboard from './pages/Dashboard';
import MapView from './pages/MapView';
import Lines from './pages/Lines';
import Stops from './pages/Stops';
import Fares from './pages/Fares';
import Companies from './pages/Companies';
import TransferScenario from './pages/TransferScenario';
import ExcelLens from './pages/ExcelLens';
import DbComparator from './pages/DbComparator';
import SqlQueryPlayground from './pages/SqlQueryPlayground';
import TextComparator from './pages/TextComparator';
import DataCleaner from './pages/DataCleaner';
import UniversalConverter from './pages/UniversalConverter';
import PdfToolbox from './pages/PdfToolbox';
import TaskManager from './pages/TaskManager';
import Login from './pages/Login';
import Projects from './pages/Projects';
import ProjectBoard from './pages/ProjectBoard';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import TaskReports from './pages/TaskReports';
import ActivityFeed from './pages/ActivityFeed';
import EgoIntegration from './pages/EgoIntegration';
import StokTakip from './pages/StokTakip';
import SecurityAudit from './pages/SecurityAudit';
import { StokProvider } from './context/StokContext';
import { ServerStatusProvider, ServerStatusBadge } from './components/ServerStatus';
import './index.css';

// Language context
export const LangContext = createContext({ lang: 'tr', setLang: () => {} });
export const useLang = () => useContext(LangContext);

// Theme context
export const ThemeContext = createContext({ 
  themeMode: 'light', 
  themeColor: 'blue', 
  setThemeMode: () => {}, 
  setThemeColor: () => {} 
});
export const useTheme = () => useContext(ThemeContext);

function UserMenu() {
  const { currentUser, logout, isAdmin, isLeader } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!currentUser) return null;

  return (
    <div className="user-menu-wrapper" ref={ref}>
      <button className="user-menu-trigger" onClick={() => setOpen(o => !o)}>
        <UserAvatar user={currentUser} size={28} />
        <span className="user-menu-name">{currentUser.name}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-info">
            <UserAvatar user={currentUser} size={36} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{currentUser.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{currentUser.email}</div>
              <div className="role-badge-sm" style={{ marginTop: 2 }}>
                {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'leader' ? 'Takım Lideri' : 'Kullanıcı'}
              </div>
            </div>
          </div>
          <div className="user-menu-divider" />
          <NavLink to="/profile" className="user-menu-item" onClick={() => setOpen(false)}>
            <User size={14} /> Profilim
          </NavLink>
          {isLeader && (
            <NavLink to="/admin/users" className="user-menu-item" onClick={() => setOpen(false)}>
              <UserCog size={14} /> Kullanıcı Yönetimi
            </NavLink>
          )}
          {isLeader && (
            <NavLink to="/activity" className="user-menu-item" onClick={() => setOpen(false)}>
              <Activity size={14} /> Aktivite Günlüğü
            </NavLink>
          )}
          {isLeader && (
            <NavLink to="/admin/audit" className="user-menu-item" onClick={() => setOpen(false)}>
              <Shield size={14} /> Güvenlik Günlüğü
            </NavLink>
          )}
          <button className="user-menu-item user-menu-logout" onClick={() => { logout(); setOpen(false); }}>
            <LogOut size={14} /> Çıkış Yap
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="user-menu-wrapper" ref={ref} style={{ marginRight: 16 }}>
      <button className="user-menu-trigger" onClick={() => setOpen(o => !o)} style={{ position: 'relative', padding: 8, background: open ? 'var(--bg-hover)' : 'transparent' }}>
        <Bell size={18} style={{ color: 'var(--text-secondary)' }} />
        {unreadCount > 0 && (
          <span style={{ 
            position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff',
            fontSize: 10, fontWeight: 700, width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 2px var(--bg-surface)'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="user-menu-dropdown" style={{ width: 340, padding: 0, right: 0 }}>
          <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Bildirimler</span>
            {unreadCount > 0 && (
              <button className="btn-ghost-sm" onClick={markAllAsRead} style={{ fontSize: 11, padding: '4px 8px' }}>Tümünü Okundu İşaretle</button>
            )}
          </div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Henüz bildiriminiz yok.</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} onClick={() => markAsRead(n.id)} style={{ 
                  padding: '14px 16px', borderBottom: '1px solid var(--border)',
                  background: n.isRead ? 'transparent' : 'var(--bg-hover)', cursor: 'pointer',
                  transition: 'background 0.2s', opacity: n.isRead ? 0.7 : 1
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--text-primary)' }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>{new Date(n.createdAt).toLocaleString('tr-TR')}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolsWizard() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const toolItems = [
    { to: '/transfer',      icon: <Zap size={14} />,             key: 'transfer' },
    { to: '/excel',         icon: <FileSpreadsheet size={14} />,  key: 'excelLens' },
    { to: '/db-compare',    icon: <Database size={14} />,         key: 'dbComparator' },
    { to: '/sql-playground',icon: <Terminal size={14} />,         key: 'sqlPlayground' },
    { to: '/text-compare',  icon: <Columns size={14} />,          key: 'textCompare' },
    { to: '/data-cleaner',  icon: <Sparkles size={14} />,         key: 'dataCleaner' },
    { to: '/converter',     icon: <RefreshCw size={14} />,        key: 'fileConverter' },
    { to: '/pdf-toolbox',   icon: <FileText size={14} />,         key: 'pdfToolbox' },
    { to: '/tasks',         icon: <ListTodo size={14} />,         key: 'todoList' },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="tools-wizard-wrapper" ref={ref}>
      <button 
        className={`tools-wizard-btn ${open ? 'active' : ''}`}
        onClick={() => setOpen(!open)}
        title="Araçlar Sihirbazı"
      >
        <Wand2 size={24} />
      </button>

      {open && (
        <div className="tools-wizard-menu">
          <div className="tools-wizard-header">
            <h3>Ofis Araçları</h3>
            <p>Hızlı işlem menüsü</p>
          </div>
          <div className="tools-wizard-grid">
            {toolItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `tools-wizard-item${isActive ? ' active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <div className="tools-wizard-icon">{item.icon}</div>
                <span className="tools-wizard-label">{t(lang, item.key)}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SystemControlsWidget() {
  const { themeMode, setThemeMode, themeColor, setThemeColor } = useTheme();

  const colorsList = [
    { id: 'indigo',  color: '#6366f1', label: 'Space Indigo' },
    { id: 'blue',    color: '#2563eb', label: 'Nordic Blue' },
    { id: 'pink',    color: '#ff007f', label: 'Cyber Pink' },
    { id: 'emerald', color: '#10b981', label: 'Forest Emerald' },
    { id: 'orange',  color: '#f97316', label: 'Sunset Amber' },
  ];

  return (
    <div className="system-controls-widget">
      <ServerStatusBadge />
      <div className="system-controls-divider" />
      <div className="theme-toggle-list">
        {colorsList.map(c => (
          <button
            key={c.id}
            onClick={() => setThemeColor(c.id)}
            title={c.label}
            className={`theme-dot-btn${themeColor === c.id ? ' active' : ''}`}
            style={{
              background: c.color,
              boxShadow: themeColor === c.id ? `0 0 6px ${c.color}` : 'none'
            }}
          />
        ))}
      </div>
      <button 
        className="theme-mode-btn"
        onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
        title={themeMode === 'light' ? 'Gece Modu' : 'Gündüz Modu'}
      >
        {themeMode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>
    </div>
  );
}

function Navbar() {
  const { lang, setLang } = useLang();
  const { currentUser, isLeader, isStokYetkili } = useAuth();
  const [toolsOpen, setToolsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const mainItems = [
    { to: '/',          icon: <LayoutDashboard size={15} />, key: 'dashboard' },
    { to: '/map',       icon: <Map size={15} />,             key: 'map' },
    { to: '/lines',     icon: <Bus size={15} />,             key: 'lines' },
    { to: '/stops',     icon: <MapPin size={15} />,          key: 'stops' },
    { to: '/fares',     icon: <CreditCard size={15} />,      key: 'fares' },
  ];

  const toolItems = [
    { to: '/transfer',      icon: <Zap size={14} />,             key: 'transfer' },
    { to: '/excel',         icon: <FileSpreadsheet size={14} />,  key: 'excelLens' },
    { to: '/db-compare',    icon: <Database size={14} />,         key: 'dbComparator' },
    { to: '/sql-playground',icon: <Terminal size={14} />,         key: 'sqlPlayground' },
    { to: '/text-compare',  icon: <Columns size={14} />,          key: 'textCompare' },
    { to: '/data-cleaner',  icon: <Sparkles size={14} />,         key: 'dataCleaner' },
    { to: '/converter',     icon: <RefreshCw size={14} />,        key: 'fileConverter' },
    { to: '/pdf-toolbox',   icon: <FileText size={14} />,         key: 'pdfToolbox' },
    { to: '/tasks',         icon: <ListTodo size={14} />,         key: 'todoList' },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">🛠️</div>
            <div>
              <div className="sidebar-title">AATools</div>
              <div className="sidebar-subtitle">Office Suite</div>
            </div>
          </div>
        </div>

        <nav className="navbar-nav-links">
          {mainItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {t(lang, item.key)}
            </NavLink>
          ))}

          <NavLink
            to="/projects"
            className={({ isActive }) => `nav-link-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon"><FolderKanban size={15} /></span>
            Panolar
          </NavLink>

          {/* EGO Entegrasyonu */}
          <NavLink
            to="/ego"
            className={({ isActive }) => `nav-link-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">🚌</span>
            EGO
          </NavLink>

          {/* Stok Takip */}
          {isStokYetkili && (
            <NavLink
              to="/stok"
              className={({ isActive }) => `nav-link-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">📦</span>
              Stok
            </NavLink>
          )}

          {/* Leader-only nav items */}
          {isLeader && (
            <NavLink to="/reports" className={({ isActive }) => `nav-link-item${isActive ? ' active' : ''}`}>
              <span className="nav-icon"><BarChart3 size={15} /></span>
              Raporlar
            </NavLink>
          )}
        </nav>

        <div className="navbar-right">
          <div className="lang-toggle" style={{ marginRight: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                title={l.label}
                style={{ 
                  padding: '4px 6px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  background: lang === l.code ? 'var(--bg-hover)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: lang === l.code ? 1 : 0.5
                }}
              >
                <img 
                  src={`https://flagcdn.com/w40/${l.code === 'tr' ? 'tr' : 'gb'}.png`} 
                  width="20" 
                  alt={l.label} 
                  style={{ borderRadius: '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} 
                />
              </button>
            ))}
          </div>

          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function AppLayout() {
  return (
    <div className="app-layout">
      <div className="aurora-bg"></div>
      <Navbar />
      <ToolsWizard />
      <SystemControlsWidget />
      <main className="main-content">
        <div className="page-content">
          <Routes>
            <Route path="/"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/map"        element={<ProtectedRoute><MapView /></ProtectedRoute>} />
            <Route path="/lines"      element={<ProtectedRoute><Lines /></ProtectedRoute>} />
            <Route path="/stops"      element={<ProtectedRoute><Stops /></ProtectedRoute>} />
            <Route path="/fares"      element={<ProtectedRoute><Fares /></ProtectedRoute>} />
            <Route path="/companies"  element={<ProtectedRoute><Companies /></ProtectedRoute>} />
            <Route path="/transfer"   element={<ProtectedRoute><TransferScenario /></ProtectedRoute>} />
            <Route path="/excel"      element={<ProtectedRoute><ExcelLens /></ProtectedRoute>} />
            <Route path="/db-compare" element={<ProtectedRoute><DbComparator /></ProtectedRoute>} />
            <Route path="/sql-playground" element={<ProtectedRoute><SqlQueryPlayground /></ProtectedRoute>} />
            <Route path="/text-compare"   element={<ProtectedRoute><TextComparator /></ProtectedRoute>} />
            <Route path="/data-cleaner"   element={<ProtectedRoute><DataCleaner /></ProtectedRoute>} />
            <Route path="/converter"      element={<ProtectedRoute><UniversalConverter /></ProtectedRoute>} />
            <Route path="/pdf-toolbox"    element={<ProtectedRoute><PdfToolbox /></ProtectedRoute>} />
            <Route path="/tasks"          element={<ProtectedRoute><TaskManager /></ProtectedRoute>} />
            <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* New Görevler module */}
            <Route path="/projects"              element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/projects/:id/board"    element={<ProtectedRoute><ProjectBoard /></ProtectedRoute>} />
            <Route path="/reports"               element={<ProtectedRoute requiredRole="leader"><TaskReports /></ProtectedRoute>} />
            <Route path="/activity"              element={<ProtectedRoute requiredRole="leader"><ActivityFeed /></ProtectedRoute>} />
            <Route path="/admin/users"           element={<ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/audit"           element={<ProtectedRoute requiredRole="leader"><SecurityAudit /></ProtectedRoute>} />
            <Route path="/ego"                   element={<ProtectedRoute><EgoIntegration /></ProtectedRoute>} />
            <Route path="/stok"                  element={<ProtectedRoute requiredRole="stok"><StokTakip /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  const { currentUser } = useAuth();
  return (
    <NotificationProvider currentUser={currentUser}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={currentUser ? <AppLayout /> : <Navigate to="/login" replace />} />
      </Routes>
    </NotificationProvider>
  );
}

export default function App() {
  const [lang, setLang] = useState('tr');
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('aatools-theme-mode') || 'light');
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('aatools-theme-color') || 'blue');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme-mode', themeMode);
    localStorage.setItem('aatools-theme-mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme-color', themeColor);
    localStorage.setItem('aatools-theme-color', themeColor);
  }, [themeColor]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, themeColor, setThemeColor }}>
      <LangContext.Provider value={{ lang, setLang }}>
        <AuthProvider>
          <StokProvider>
            <ServerStatusProvider>
              <BrowserRouter>
                <AuthenticatedApp />
              </BrowserRouter>
            </ServerStatusProvider>
          </StokProvider>
        </AuthProvider>
      </LangContext.Provider>
    </ThemeContext.Provider>
  );
}
