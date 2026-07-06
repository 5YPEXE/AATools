import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

const NOTIFICATIONS_KEY = 'aatools-notifications';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children, currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Sadece aktif kullanıcının bildirimlerini yükle (Local Storage'dan tümünü çekip filtreleyelim)
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    try {
      const allNotifs = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
      const userNotifs = allNotifs.filter(n => n.userId === currentUser.id);
      // Tarihe göre ters sırala (en yeni en üstte)
      userNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(userNotifs);
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
    }
  }, [currentUser]);

  // Yeni bildirim ekleme fonksiyonu (Hem menüye hem de toast'a düşer)
  const addNotification = useCallback((userId, message, options = {}) => {
    const { title = 'Yeni Bildirim', type = 'info', link = null } = options;
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title,
      message,
      type,
      link,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Tüm listeyi güncelle
    try {
      const allNotifs = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
      allNotifs.push(newNotif);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(allNotifs));
    } catch (e) {}

    // Sadece mevcut kullanıcıya gönderildiyse anlık state'i ve Toast'u tetikle
    if (currentUser && currentUser.id === userId) {
      setNotifications(prev => [newNotif, ...prev]);
      
      // Toast ekle
      setToasts(prev => [...prev, newNotif]);
      // 4 saniye sonra toast'u kaldır
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newNotif.id));
      }, 4000);
    }
  }, [currentUser]);

  const markAsRead = useCallback((notificationId) => {
    if (!currentUser) return;
    
    // State güncelle
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );

    // Local Storage güncelle
    try {
      const allNotifs = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
      const updated = allNotifs.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (e) {}
  }, [currentUser]);

  const markAllAsRead = useCallback(() => {
    if (!currentUser) return;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const allNotifs = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY)) || [];
      const updated = allNotifs.map(n => n.userId === currentUser.id ? { ...n, isRead: true } : n);
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (e) {}
  }, [currentUser]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const contextValue = {
    notifications,
    unreadCount: notifications.filter(n => !n.isRead).length,
    addNotification,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {children}
      
      {/* Toast Container - Sağ Alt Köşe */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 9999,
        pointerEvents: 'none' // Toast'lar altındaki tıklamayı engellemesin diye
      }}>
        {toasts.map(toast => {
          // İkon belirleme
          let Icon = Info;
          let iconColor = '#3b82f6';
          if (toast.type === 'success') { Icon = CheckCircle2; iconColor = '#10b981'; }
          else if (toast.type === 'warning') { Icon = AlertTriangle; iconColor = '#f59e0b'; }
          else if (toast.type === 'error') { Icon = AlertCircle; iconColor = '#ef4444'; }

          return (
            <div key={toast.id} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              width: 320,
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              pointerEvents: 'auto', // Bunu auto yapalım ki kapatabilsin
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              borderLeft: `4px solid ${iconColor}`
            }}>
              <Icon size={20} style={{ color: iconColor, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {toast.title}
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {toast.message}
                </p>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                style={{ 
                  background: 'transparent', border: 'none', color: 'var(--text-tertiary)', 
                  cursor: 'pointer', padding: 4, borderRadius: 6 
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}
