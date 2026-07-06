import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// ── Crypto Helpers ─────────────────────────────────────────────────────────────
// SHA-256 via Web Crypto API (async, built into all modern browsers)
export async function hashPassword(email, password) {
  const data = new TextEncoder().encode(`${email.toLowerCase()}:${password}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Legacy btoa hash — only used for migrating old stored passwords on first login
function legacyHash(email, password) {
  return btoa(`${email.toLowerCase()}:${password}`);
}

// Generates a cryptographically random 14-char password
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  const arr = new Uint8Array(14);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join('');
}

const FIRST_RUN_KEY = 'aatools-first-run-secret';

// ── Helpers ─────────────────────────────────────────────────────────────────
const KEYS = {
  users:    'aatools-auth-users',
  session:  'aatools-auth-session',
  projects: 'aatools-projects',
  tasks:    'aatools-jira-tasks',
  activity: 'aatools-activity-log',
};

export const KEYS_STORE = KEYS;

const AVATAR_COLORS = [
  '#6366f1', '#2563eb', '#10b981', '#f97316', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#14b8a6',
];

const pickColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];

export const TEAMS = [
  { id: 'idare', label: 'İdare', prefix: 'ANK-IDR' },
  { id: 'support', label: 'Support', prefix: 'ANK-SUP' },
  { id: 'call_desk', label: 'Call Desk', prefix: 'ANK-CALL' },
  { id: 'teknik_destek', label: 'Teknik Destek', prefix: 'ANK-TECH' },
  { id: 'muhasebe', label: 'Muhasebe', prefix: 'ANK-MHSB' },
  { id: 'depo', label: 'Depo', prefix: 'ANK-DEPO' }
];

// Admin template — passwordHash set async at runtime
const DEFAULT_ADMIN_BASE = {
  id: 'user-admin-1',
  name: 'Admin',
  email: 'admin@aatools.com',
  role: 'admin',
  avatarColor: '#6366f1',
  createdAt: new Date().toISOString(),
  isActive: true,
  mustChangePassword: true,
  team: 'Yönetim',
  title: 'Sistem Yöneticisi',
};

const SESSION_HOURS = 8;

function getUsers() {
  try { return JSON.parse(localStorage.getItem(KEYS.users)) || []; }
  catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(KEYS.session)); }
  catch { return null; }
}

function saveSession(session) {
  localStorage.setItem(KEYS.session, JSON.stringify(session));
}

function logActivity(userId, action, entityType, entityId, details = {}) {
  try {
    const logs = JSON.parse(localStorage.getItem(KEYS.activity)) || [];
    logs.unshift({
      id: `act-${Date.now()}`,
      userId,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    });
    // Keep last 500 entries
    localStorage.setItem(KEYS.activity, JSON.stringify(logs.slice(0, 500)));
  } catch {}
}

export { logActivity };

// ── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Seed admin with random password if no users exist
  useEffect(() => {
    const users = getUsers();
    if (users.length === 0) {
      const tempPassword = generateTempPassword();
      hashPassword('admin@aatools.com', tempPassword).then(hash => {
        const admin = { ...DEFAULT_ADMIN_BASE, passwordHash: hash };
        saveUsers([admin]);
        // Store plaintext temporarily so Login page can display it once
        localStorage.setItem(FIRST_RUN_KEY, tempPassword);
      });
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const session = getSession();
    if (session) {
      const now = new Date();
      const expires = new Date(session.expiresAt);
      if (now < expires) {
        const users = getUsers();
        const user = users.find(u => u.id === session.userId);
        if (user && user.isActive) {
          setCurrentUser(user);
        } else {
          localStorage.removeItem(KEYS.session);
        }
      } else {
        localStorage.removeItem(KEYS.session);
      }
    }
    setLoading(false);
  }, []);

  // ── login (async — SHA-256 + btoa migration) ─────────────────────────────
  const login = useCallback(async (email, password) => {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: 'Kullanıcı bulunamadı.' };
    if (!user.isActive) return { success: false, error: 'Bu hesap devre dışı bırakılmış.' };

    const sha256 = await hashPassword(email, password);
    const legacy  = legacyHash(email, password);

    let passwordOk = user.passwordHash === sha256;

    if (!passwordOk && user.passwordHash === legacy) {
      // Automatically migrate to SHA-256 on next login
      passwordOk = true;
      const upgraded = users.map(u => u.id === user.id ? { ...u, passwordHash: sha256 } : u);
      saveUsers(upgraded);
    }

    if (!passwordOk) return { success: false, error: 'Şifre hatalı.' };

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
    saveSession({ userId: user.id, loginAt: now.toISOString(), expiresAt });
    setCurrentUser(user);
    logActivity(user.id, 'user_login', 'user', user.id, { email: user.email });
    return { success: true, user };
  }, []);

  const logout = useCallback(() => {
    if (currentUser) {
      logActivity(currentUser.id, 'user_logout', 'user', currentUser.id, {});
    }
    localStorage.removeItem(KEYS.session);
    setCurrentUser(null);
  }, [currentUser]);

  const changePassword = useCallback(async (newPassword) => {
    if (!currentUser) return { success: false, error: 'Oturum yok.' };
    const users = getUsers();
    const idx = users.findIndex(u => u.id === currentUser.id);
    if (idx === -1) return { success: false, error: 'Kullanıcı bulunamadı.' };
    users[idx].passwordHash = await hashPassword(users[idx].email, newPassword);
    users[idx].mustChangePassword = false;
    saveUsers(users);
    setCurrentUser(users[idx]);
    // Clear first-run secret if admin changed their password
    localStorage.removeItem(FIRST_RUN_KEY);
    logActivity(currentUser.id, 'password_changed', 'user', currentUser.id, {});
    return { success: true };
  }, [currentUser]);

  const register = useCallback(async (name, email, password, role = 'member', team = '', title = '') => {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Bu e-posta zaten kayıtlı.' };
    }
    const newUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await hashPassword(email, password),
      role,
      team: team.trim(),
      title: title.trim(),
      avatarColor: pickColor(users.length),
      createdAt: new Date().toISOString(),
      isActive: true,
      mustChangePassword: false,
    };
    saveUsers([...users, newUser]);
    if (currentUser) {
      logActivity(currentUser.id, 'user_created', 'user', newUser.id, { name: newUser.name, role, team, title });
    }
    return { success: true, user: newUser };
  }, [currentUser]);

  const updateUser = useCallback((userId, updates) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return { success: false, error: 'Kullanıcı bulunamadı.' };
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
    if (currentUser?.id === userId) setCurrentUser(users[idx]);
    if (currentUser) {
      logActivity(currentUser.id, 'user_updated', 'user', userId, updates);
    }
    return { success: true };
  }, [currentUser]);

  const getAllUsers = useCallback(() => getUsers(), []);

  const refreshCurrentUser = useCallback(() => {
    if (!currentUser) return;
    const users = getUsers();
    const u = users.find(u => u.id === currentUser.id);
    if (u) setCurrentUser(u);
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      login,
      logout,
      changePassword,
      register,
      updateUser,
      getAllUsers,
      refreshCurrentUser,
      isAdmin: currentUser?.role === 'admin',
      isLeader: currentUser?.role === 'admin' || currentUser?.role === 'leader',
      // Stok modülü yetkileri
      isStokYetkili: currentUser?.role === 'admin' ||
                     currentUser?.role === 'leader' ||
                     currentUser?.team === 'Depo' ||
                     currentUser?.team === 'Muhasebe' ||
                     currentUser?.team === 'depo' ||
                     currentUser?.team === 'muhasebe',
      isStokAdmin:   currentUser?.role === 'admin' ||
                     currentUser?.role === 'leader' ||
                     currentUser?.team === 'Depo' ||
                     currentUser?.team === 'depo',
      isStokReadOnly: (currentUser?.team === 'Muhasebe' || currentUser?.team === 'muhasebe') &&
                      currentUser?.role !== 'admin' &&
                      currentUser?.role !== 'leader',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
