import React, { useState, useEffect, createContext, useContext } from 'react';
import { ServerOff, ServerCrash, CheckCircle, RefreshCw, Terminal, X } from 'lucide-react';

const ServerStatusContext = createContext({ isOnline: false, loading: true });
export const useServerStatus = () => useContext(ServerStatusContext);

// How often to ping (ms)
const PING_INTERVAL = 10_000;

export function ServerStatusProvider({ children }) {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  const ping = async () => {
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
      setIsOnline(res.ok);
    } catch {
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ping();
    const id = setInterval(ping, PING_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <ServerStatusContext.Provider value={{ isOnline, loading, refetch: ping }}>
      {children}
    </ServerStatusContext.Provider>
  );
}

/** Compact pill for navbar */
export function ServerStatusBadge() {
  const { isOnline, loading, refetch } = useServerStatus();
  const [showTip, setShowTip] = useState(false);

  if (loading) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        className={`server-status-badge ${isOnline ? 'online' : 'offline'}`}
        onClick={() => setShowTip(t => !t)}
        title={isOnline ? 'Sunucu bağlı' : 'Sunucu bağlı değil — tıkla'}
      >
        <span className="server-status-dot" />
        <span>{isOnline ? 'Sunucu' : 'Sunucu Yok'}</span>
        {!isOnline && <ServerCrash size={12} />}
        {isOnline && <CheckCircle size={12} />}
      </button>

      {showTip && !isOnline && (
        <div className="server-tip-card">
          <div className="server-tip-header">
            <span>Sunucu Başlatma</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="server-tip-refresh" onClick={refetch} title="Tekrar dene">
                <RefreshCw size={13} />
              </button>
              <button className="server-tip-close" onClick={() => setShowTip(false)}>
                <X size={13} />
              </button>
            </div>
          </div>
          <p className="server-tip-desc">
            Dashboard ve diğer veri sayfaları için Express sunucusunun çalışması gerekiyor.
            Aşağıdaki komutu proje klasöründe çalıştırın:
          </p>
          <div className="server-tip-cmd">
            <Terminal size={13} />
            <code>cd AATools &amp;&amp; node server/index.js</code>
          </div>
          <div className="server-tip-cmd" style={{ marginTop: 6 }}>
            <Terminal size={13} />
            <code>Veya: npm run server</code>
          </div>
          <button className="server-tip-retry" onClick={refetch}>
            <RefreshCw size={13} /> Bağlantıyı Kontrol Et
          </button>
        </div>
      )}
    </div>
  );
}

/** Full empty-state card for offline pages */
export function OfflineState({ message = 'Sunucu bağlı değil.' }) {
  const { refetch } = useServerStatus();
  return (
    <div className="offline-state">
      <ServerOff size={40} className="offline-state-icon" />
      <div className="offline-state-title">Veri Yüklenemiyor</div>
      <div className="offline-state-desc">{message}</div>
      <div className="server-tip-cmd" style={{ marginBottom: 12 }}>
        <Terminal size={13} />
        <code>node server/index.js</code>
      </div>
      <button className="btn-primary" onClick={refetch} style={{ gap: 6, fontSize: 13 }}>
        <RefreshCw size={14} /> Tekrar Dene
      </button>
    </div>
  );
}
