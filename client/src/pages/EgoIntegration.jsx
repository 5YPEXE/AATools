import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw, Megaphone, DollarSign, GitCompare,
  ExternalLink, AlertCircle, CheckCircle2, MinusCircle,
  Clock, Wifi, WifiOff, Search, Info
} from 'lucide-react';

const API = '/api/ego';

function useEgoFetch(endpoint) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setFetchedAt(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load, fetchedAt };
}

// ── EGO Duyurular Paneli ──────────────────────────────────────────────────
function DuyurularPanel() {
  const { data, loading, error, reload, fetchedAt } = useEgoFetch('duyurular');
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    if (!data || !data.items) return [];
    if (!search.trim()) return data.items;
    const q = search.toLowerCase();
    return data.items.filter(item => 
      (item.title && item.title.toLowerCase().includes(q)) || 
      (item.excerpt && item.excerpt.toLowerCase().includes(q))
    );
  }, [data, search]);

  return (
    <div className="chart-card" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
          <Megaphone size={16} style={{ color: 'var(--accent)' }} />
          EGO Duyuruları
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {fetchedAt && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />
              {fetchedAt.toLocaleTimeString('tr-TR')}
            </span>
          )}
          <button className="btn-ghost-sm" onClick={reload} disabled={loading} title="Yenile">
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div className="search-bar" style={{ marginBottom: 16 }}>
        <Search size={14} className="search-icon" />
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="Duyurularda ara..." 
          className="search-input" 
          style={{ width: '100%' }} 
        />
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 13, padding: 12, background: 'rgba(239,68,68,0.06)', borderRadius: 8 }}>
          <WifiOff size={14} />
          EGO sitesine ulaşılamadı. Sunucu bağlantısı veya internet erişimi gerekiyor.
        </div>
      )}

      {data && !loading && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {data.fromCache && (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 10 }}>
              ⚡ Önbellekten yüklendi (15 dk geçerli)
            </div>
          )}
          {data.items && filteredItems.length === 0 && (
            <div className="empty-state-sm">
              {data.items.length === 0 ? 'Duyuru bulunamadı.' : 'Arama sonucu bulunamadı.'}
            </div>
          )}
          <div style={{ 
            display: 'flex', flexDirection: 'column', gap: 8, 
            overflowY: 'auto', maxHeight: 500, paddingRight: 4 
          }}>
            {filteredItems.map((item, i) => (
              <div key={i} style={{
                padding: '12px 14px',
                background: 'var(--bg-hover)',
                borderRadius: 10,
                borderLeft: '3px solid var(--accent)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', flex: 1, lineHeight: 1.4 }}>
                    {item.title}
                    <ExternalLink size={11} style={{ marginLeft: 6, color: 'var(--text-tertiary)', verticalAlign: 'middle' }} />
                  </a>
                  {item.date && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', flexShrink: 0 }}>{item.date}</span>}
                </div>
                {item.excerpt && (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.excerpt}…
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Fallback: eğer items boşsa rawText göster */}
          {(!data.items || data.items.length === 0) && data.rawText && (
            <pre style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
              {data.rawText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ── Ücret Tarifesi Paneli ──────────────────────────────────────────────────
function TarifelerPanel() {
  const { data, loading, error, reload, fetchedAt } = useEgoFetch('tarifeler');

  const renderTable = (table, ti) => {
    if (!table || table.length === 0) return null;

    let headerIndex = 0;
    // Asıl başlık satırını bul (genelde "TAM" veya "İNDİRİMLİ" yazar, ve birden fazla hücredir)
    for (let i = 0; i < Math.min(3, table.length); i++) {
      if (table[i].length > 1 && table[i].some(c => c && (c.includes('TAM') || c.includes('İNDİRİMLİ') || c.includes('FİYAT')))) {
        headerIndex = i;
        break;
      }
    }

    let headers = [...table[headerIndex]];
    const dataRows = [];
    const infoRows = [];

    // Başlıktan önceki satırları (genel başlıkları) bilgi olarak ekle
    for (let i = 0; i < headerIndex; i++) {
      if (table[i].length === 1) {
        infoRows.push(table[i][0]);
      } else {
        infoRows.push(table[i].join(' - '));
      }
    }

    let maxCols = headers.length;
    for (let i = headerIndex + 1; i < table.length; i++) {
      if (table[i].length > maxCols) maxCols = table[i].length;
    }

    if (maxCols > headers.length && headers.length > 0) {
      const diff = maxCols - headers.length;
      for (let i = 0; i < diff; i++) {
        headers.unshift('AÇIKLAMA');
      }
    }

    // Satırları ayır
    for (let i = headerIndex + 1; i < table.length; i++) {
      const row = table[i];
      if (row.length === 1 && row[0].length > 40) {
        infoRows.push(row[0]);
      } else if (row.length > 0 && row.some(cell => cell.trim().length > 0)) {
        dataRows.push(row);
      }
    }

    return (
      <div key={ti} style={{ marginBottom: 20 }}>
        <div className="task-list-table-wrap" style={{ marginBottom: 12 }}>
          <table className="task-list-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri} className="task-list-row">
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ 
                      fontWeight: ci === 0 ? 600 : 400,
                      color: ci === 0 ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>
                      {cell}
                    </td>
                  ))}
                  {/* Eğer satırın hücresi eksikse boş td ekle */}
                  {Array.from({ length: Math.max(0, maxCols - row.length) }).map((_, emptyIdx) => (
                    <td key={`empty-${emptyIdx}`}></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Kullanım Detayları (Info Boxes) */}
        {infoRows.map((info, idx) => (
          <div key={`info-${idx}`} style={{ 
            display: 'flex', gap: 10, padding: '12px 14px', 
            background: 'var(--surface-2, var(--bg-hover))', 
            borderRadius: 10, borderLeft: '3px solid #10b981',
            marginTop: 8
          }}>
            <Info size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {info}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="chart-card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
          <DollarSign size={16} style={{ color: '#10b981' }} />
          EGO Ücret Tarifesi
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {fetchedAt && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />
              {fetchedAt.toLocaleTimeString('tr-TR')}
            </span>
          )}
          <a href="https://www.ego.gov.tr/sayfa/2098/tasima-ucretleri" target="_blank" rel="noopener noreferrer"
            className="btn-ghost-sm" title="EGO Sitesinde Aç">
            <ExternalLink size={13} />
          </a>
          <button className="btn-ghost-sm" onClick={reload} disabled={loading} title="Yenile">
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="spinner" /></div>}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 13, padding: 12, background: 'rgba(239,68,68,0.06)', borderRadius: 8 }}>
          <WifiOff size={14} /> EGO sitesine ulaşılamadı.
        </div>
      )}

      {data && !loading && (
        <div>
          {data.fromCache && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 14 }}>⚡ Önbellekten yüklendi</div>}

          {/* Tablolar */}
          {data.tables && data.tables.length > 0 ? (
            data.tables.map((table, ti) => renderTable(table, ti))
          ) : (
            /* Fallback: düz metin */
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {data.rawText || 'İçerik alınamadı.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Hat Karşılaştırma Paneli ───────────────────────────────────────────────
function KarsilastirPanel() {
  const { data, loading, error, reload, fetchedAt } = useEgoFetch('karsilastir');
  const [activeTab, setActiveTab] = useState('ozet');

  return (
    <div className="chart-card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
          <GitCompare size={16} style={{ color: '#8b5cf6' }} />
          DB ↔ EGO Hat Karşılaştırması
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {fetchedAt && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} />
              {fetchedAt.toLocaleTimeString('tr-TR')}
            </span>
          )}
          <button className="btn-ghost-sm" onClick={reload} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><div className="spinner" /></div>}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 13, padding: 12, background: 'rgba(239,68,68,0.06)', borderRadius: 8 }}>
          <WifiOff size={14} /> {error.includes('ulaşılamadı') ? 'EGO sitesine ulaşılamadı.' : 'Sunucu bağlantısı yok.'}
        </div>
      )}

      {data && !loading && (
        <div>
          {/* Özet Kartlar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'DB\'deki Satırlar', value: data.ozet?.dbToplamHat, icon: <Wifi size={14} />, color: 'var(--text-secondary)' },
              { label: 'DB Benzersiz Hat', value: data.ozet?.dbBenzersizHat, icon: <Wifi size={14} />, color: 'var(--accent)' },
              { label: 'EGO\'daki Hat', value: data.ozet?.egoBenzersizHat ?? data.ozet?.egoToplamHat, icon: <Wifi size={14} />, color: '#10b981' },
              { label: 'Ortak Hatlar', value: data.ozet?.ortakHatSayisi, icon: <CheckCircle2 size={14} />, color: '#22c55e' },
              { label: 'Sadece EGO\'da', value: data.ozet?.sadeceEGOdeCount, icon: <MinusCircle size={14} />, color: '#f97316' },
              { label: 'Sadece DB\'de', value: data.ozet?.sadeceDBredeCount, icon: <AlertCircle size={14} />, color: '#ef4444' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'var(--bg-hover)', borderRadius: 10, padding: '12px 14px',
                borderLeft: `3px solid ${s.color}`, display: 'flex', flexDirection: 'column', gap: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                  {s.icon} {s.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{s.value ?? '—'}</div>
              </div>
            ))}
          </div>

          {/* Sekmeler */}
          <div className="tabs" style={{ marginBottom: 16 }}>
            {[
              { key: 'sadeceEGOde', label: `Sadece EGO'da (${data.ozet?.sadeceEGOdeCount})` },
              { key: 'sadeceDBrede', label: `Sadece DB'de (${data.ozet?.sadeceDBredeCount})` },
              { key: 'ortaklar', label: `Ortak (${data.ozet?.ortakHatSayisi})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div className="task-list-table-wrap" style={{ maxHeight: 350, overflowY: 'auto' }}>
            {activeTab === 'sadeceEGOde' && (
              <table className="task-list-table">
                <thead><tr><th style={{ width: 120 }}>EGO Kodu</th><th>Hat Adı</th></tr></thead>
                <tbody>
                  {(data.sadeceEGOde || []).map((h, i) => (
                    <tr key={i} className="task-list-row">
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f97316' }}>{h.egoKodu}</td>
                      <td style={{ fontSize: 13 }}>{h.ad}</td>
                    </tr>
                  ))}
                  {(!data.sadeceEGOde || data.sadeceEGOde.length === 0) && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>Kayıt bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            )}
            {activeTab === 'sadeceDBrede' && (
              <table className="task-list-table">
                <thead><tr><th style={{ width: 120 }}>Line ID</th><th>Hat Adı</th></tr></thead>
                <tbody>
                  {(data.sadeceDBrede || []).map((h, i) => (
                    <tr key={i} className="task-list-row">
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ef4444' }}>{h.line_id}</td>
                      <td style={{ fontSize: 13 }}>{h.name}</td>
                    </tr>
                  ))}
                  {(!data.sadeceDBrede || data.sadeceDBrede.length === 0) && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>Kayıt bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            )}
            {activeTab === 'ortaklar' && (
              <table className="task-list-table">
                <thead><tr><th style={{ width: 120 }}>Line ID</th><th>Hat Adı</th></tr></thead>
                <tbody>
                  {(data.ortaklar || []).map((h, i) => (
                    <tr key={i} className="task-list-row">
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#22c55e' }}>{h.line_id}</td>
                      <td style={{ fontSize: 13 }}>{h.name}</td>
                    </tr>
                  ))}
                  {(!data.ortaklar || data.ortaklar.length === 0) && (
                    <tr><td colSpan={2} style={{ textAlign: 'center', padding: 24, color: 'var(--text-tertiary)' }}>Kayıt bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ana Sayfa Bileşeni ─────────────────────────────────────────────────────
export default function EgoIntegration() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="https://www.ego.gov.tr/favicon.ico" alt="EGO" width={26} height={26} style={{ borderRadius: 6, background: '#fff' }} onError={e => e.target.style.display='none'} />
            EGO Entegrasyonu
          </h1>
          <p className="page-subtitle">
            EGO Genel Müdürlüğü sitesinden canlı veri — duyurular, ücret tarifesi, hat karşılaştırması
          </p>
        </div>
        <div style={{ 
          fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6, 
          background: 'var(--bg-hover)', padding: '6px 12px', borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          <Wifi size={14} />
          Veriler 15 dakika önbelleğe alınır
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20, marginBottom: 20 }}>
        <DuyurularPanel />
        <TarifelerPanel />
      </div>

      <KarsilastirPanel />
    </div>
  );
}
