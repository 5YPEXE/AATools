import React, { useState, useEffect } from 'react';
import { Database, FileCode, CheckCircle, AlertTriangle, ArrowRight, Upload, Play } from 'lucide-react';
import { t } from '../i18n';
import { useLang } from '../App';

export default function DbComparator() {
  const { lang } = useLang();
  const [dbs, setDbs] = useState([]);
  const [sourceDb, setSourceDb] = useState('');
  const [targetDb, setTargetDb] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [schemaDiff, setSchemaDiff] = useState(null);
  const [activeTab, setActiveTab] = useState('schema');
  
  const [selectedTable, setSelectedTable] = useState('');
  const [dataDiff, setDataDiff] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch DB List
  const fetchDbList = async () => {
    try {
      const res = await fetch('/api/db-compare/list');
      if (res.ok) {
        const data = await res.json();
        setDbs(data);
        if (data.length > 0) {
          if (!sourceDb) setSourceDb(data[0]);
          if (!targetDb && data.length > 1) setSourceDb(data[0]);
          if (!targetDb && data.length > 1) setTargetDb(data[1]);
        }
      }
    } catch (err) {
      console.error('Veritabanı listesi alınamadı:', err);
    }
  };

  useEffect(() => {
    fetchDbList();
  }, []);

  // Upload SQLite database file
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.sqlite')) {
      alert('Sadece .sqlite uzantılı dosyalar yüklenebilir.');
      return;
    }

    setUploading(true);
    try {
      const res = await fetch('/api/db-compare/upload', {
        method: 'POST',
        headers: {
          'x-filename': file.name,
          'Content-Type': 'application/octet-stream'
        },
        body: file
      });
      const data = await res.json();
      if (data.success) {
        await fetchDbList();
        if (type === 'source') {
          setSourceDb(data.filename);
        } else {
          setTargetDb(data.filename);
        }
      } else {
        alert('Yükleme başarısız: ' + data.error);
      }
    } catch (err) {
      alert('Dosya yüklenirken hata oluştu: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Run schema comparison
  const handleCompare = async () => {
    if (!sourceDb || !targetDb) {
      alert('Lütfen iki farklı veritabanı seçin.');
      return;
    }
    setError(null);
    setLoading(true);
    setSchemaDiff(null);
    setDataDiff(null);
    setSelectedTable('');

    try {
      const res = await fetch(`/api/db-compare/schema-diff?source=${sourceDb}&target=${targetDb}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Karşılaştırma başarısız oldu.');
      }
      const data = await res.json();
      setSchemaDiff(data);
      if (data.commonTables && data.commonTables.length > 0) {
        setSelectedTable(data.commonTables[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run data comparison for selected table
  useEffect(() => {
    if (!selectedTable || !sourceDb || !targetDb) return;

    const fetchTableDiff = async () => {
      setDataLoading(true);
      setDataDiff(null);
      try {
        const res = await fetch(`/api/db-compare/data-diff?source=${sourceDb}&target=${targetDb}&table=${selectedTable}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Tablo verisi alınamadı.');
        }
        const data = await res.json();
        setDataDiff(data);
      } catch (err) {
        console.error(err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchTableDiff();
  }, [selectedTable, sourceDb, targetDb]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start' }}>
        <div className="sidebar-logo-icon" style={{ 
          width: '36px', 
          height: '36px', 
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))', 
          borderRadius: 'var(--radius-md)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '18px' 
        }}>
          💾
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            DB Karşılaştırıcı
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            İki SQLite veritabanı dosyasının şema yapısını ve satır düzeyindeki verilerini karşılaştırın.
          </p>
        </div>
      </div>

      {/* Select databases panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Source DB Selection */}
        <div className="chart-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-accent)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Kaynak Veritabanı (Dosya 1 - Eski)
          </h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select 
              value={sourceDb} 
              onChange={(e) => setSourceDb(e.target.value)}
              className="select-filter" 
              style={{ flex: 1, height: '40px' }}
            >
              {dbs.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '0 16px', 
              height: '40px', 
              background: 'var(--bg-hover)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-md)', 
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}>
              <Upload size={16} /> Yükle
              <input type="file" accept=".sqlite" onChange={(e) => handleFileUpload(e, 'source')} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Target DB Selection */}
        <div className="chart-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--accent2)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hedef Veritabanı (Dosya 2 - Yeni)
          </h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select 
              value={targetDb} 
              onChange={(e) => setTargetDb(e.target.value)}
              className="select-filter" 
              style={{ flex: 1, height: '40px' }}
            >
              {dbs.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '0 16px', 
              height: '40px', 
              background: 'var(--bg-hover)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-md)', 
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}>
              <Upload size={16} /> Yükle
              <input type="file" accept=".sqlite" onChange={(e) => handleFileUpload(e, 'target')} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>

      {/* Compare trigger button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button 
          onClick={handleCompare} 
          disabled={loading || uploading || sourceDb === targetDb}
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontSize: '14px' }}
        >
          {loading ? <div className="spinner" style={{ width: '16px', height: '16px', margin: 0 }}></div> : <Play size={16} />}
          {loading ? 'Karşılaştırılıyor...' : 'Veritabanlarını Karşılaştır'}
        </button>
      </div>

      {error && (
        <div className="error-state" style={{ padding: '16px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--accent3)' }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Comparison Results */}
      {schemaDiff && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Tabs */}
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'schema' ? 'active' : ''}`}
              onClick={() => setActiveTab('schema')}
            >
              <FileCode size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
              Şema Farkları
            </button>
            <button 
              className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              <Database size={16} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
              Veri Karşılaştırma
            </button>
          </div>

          {/* TAB 1: SCHEMA DIFFS */}
          {activeTab === 'schema' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Summary Cards */}
              <div className="kpi-grid">
                <div className="kpi-card" style={{ '--kpi-accent': 'var(--green)', '--kpi-accent-bg': 'rgba(0, 212, 170, 0.1)' }}>
                  <div className="kpi-card-value">{schemaDiff.addedTables.length}</div>
                  <div className="kpi-card-label">Eklenen Tablolar</div>
                </div>
                <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent3)', '--kpi-accent-bg': 'rgba(255, 107, 107, 0.1)' }}>
                  <div className="kpi-card-value">{schemaDiff.removedTables.length}</div>
                  <div className="kpi-card-label">Silinen Tablolar</div>
                </div>
                <div className="kpi-card" style={{ '--kpi-accent': 'var(--yellow)', '--kpi-accent-bg': 'rgba(245, 166, 35, 0.1)' }}>
                  <div className="kpi-card-value">{schemaDiff.modifiedTables.length}</div>
                  <div className="kpi-card-label">Şeması Değişen Tablolar</div>
                </div>
              </div>

              {/* Detailed Schema Diffs */}
              <div className="table-card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>Detaylı Fark Listesi</h3>

                {schemaDiff.addedTables.length === 0 && 
                 schemaDiff.removedTables.length === 0 && 
                 schemaDiff.modifiedTables.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    <CheckCircle size={32} style={{ color: 'var(--accent2)', marginBottom: '10px' }} />
                    <p>Veritabanı şemaları tamamen aynı!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Added Tables */}
                    {schemaDiff.addedTables.map(t => (
                      <div key={t} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', background: 'rgba(0, 212, 170, 0.04)' }}>
                        <span className="badge badge-green" style={{ marginBottom: '8px' }}>+ EKLENEN TABLO</span>
                        <div className="mono" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{t}</div>
                      </div>
                    ))}

                    {/* Removed Tables */}
                    {schemaDiff.removedTables.map(t => (
                      <div key={t} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '12px 16px', background: 'rgba(255, 107, 107, 0.04)' }}>
                        <span className="badge badge-red" style={{ marginBottom: '8px' }}>- SİLİNEN TABLO</span>
                        <div className="mono" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{t}</div>
                      </div>
                    ))}

                    {/* Modified Tables */}
                    {schemaDiff.modifiedTables.map(mt => (
                      <div key={mt.name} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'rgba(245, 166, 35, 0.04)' }}>
                        <span className="badge badge-orange" style={{ marginBottom: '10px' }}>~ ŞEMASI GÜNCELLENEN TABLO</span>
                        <div className="mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>{mt.name}</div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px' }}>
                          {/* Added columns */}
                          {mt.addedCols.map(c => (
                            <div key={c.name} style={{ fontSize: '13px', color: 'var(--accent2)' }}>
                              <span style={{ fontWeight: 600 }}>+ Sütun Eklendi:</span> <code className="mono">{c.name} ({c.type})</code>
                            </div>
                          ))}

                          {/* Removed columns */}
                          {mt.removedCols.map(c => (
                            <div key={c.name} style={{ fontSize: '13px', color: 'var(--accent3)' }}>
                              <span style={{ fontWeight: 600 }}>- Sütun Silindi:</span> <code className="mono">{c.name} ({c.type})</code>
                            </div>
                          ))}

                          {/* Changed columns */}
                          {mt.changedCols.map(c => (
                            <div key={c.name} style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                              <span style={{ fontWeight: 600, color: 'var(--accent4)' }}>~ Sütun Özelliği Değişti:</span> <code className="mono">{c.name}</code>: 
                              <span style={{ textDecoration: 'line-through', opacity: 0.5, marginLeft: '6px' }}>{c.oldType}</span>
                              <ArrowRight size={12} style={{ display: 'inline', margin: '0 6px' }} />
                              <span>{c.newType}</span>
                              {c.oldPk !== c.newPk && <span className="badge badge-blue" style={{ marginLeft: '6px' }}>PK Değişimi</span>}
                              {c.oldNotnull !== c.newNotnull && <span className="badge badge-blue" style={{ marginLeft: '6px' }}>Not Null Değişimi</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DATA DIFFS */}
          {activeTab === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="table-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>Karşılaştırılacak Tablo Seçin</h3>
                  <select 
                    value={selectedTable} 
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="select-filter"
                    style={{ width: '220px' }}
                  >
                    {schemaDiff.commonTables.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {dataLoading && (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Veri karşılaştırılıyor, lütfen bekleyin...</p>
                </div>
              )}

              {dataDiff && !dataLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* KPIs */}
                  <div className="kpi-grid">
                    <div className="kpi-card" style={{ '--kpi-accent': 'var(--fg-4)', '--kpi-accent-bg': 'rgba(148, 163, 184, 0.1)' }}>
                      <div className="kpi-card-value">{dataDiff.counts.total}</div>
                      <div className="kpi-card-label">Toplam Satır (Hedef)</div>
                    </div>
                    <div className="kpi-card" style={{ '--kpi-accent': 'var(--green)', '--kpi-accent-bg': 'rgba(0, 212, 170, 0.1)' }}>
                      <div className="kpi-card-value">{dataDiff.counts.added}</div>
                      <div className="kpi-card-label">Yeni Satırlar</div>
                    </div>
                    <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent3)', '--kpi-accent-bg': 'rgba(255, 107, 107, 0.1)' }}>
                      <div className="kpi-card-value">{dataDiff.counts.removed}</div>
                      <div className="kpi-card-label">Silinen Satırlar</div>
                    </div>
                    <div className="kpi-card" style={{ '--kpi-accent': 'var(--yellow)', '--kpi-accent-bg': 'rgba(245, 166, 35, 0.1)' }}>
                      <div className="kpi-card-value">{dataDiff.counts.changed}</div>
                      <div className="kpi-card-label">Değişen Satırlar</div>
                    </div>
                  </div>

                  {/* Primary key info */}
                  {dataDiff.primaryKeys.length > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-hover)', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                      🔑 Anahtar sütunlar eşleştirme için kullanıldı: <strong className="mono" style={{ color: 'var(--text-accent)' }}>{dataDiff.primaryKeys.join(', ')}</strong>
                    </div>
                  )}

                  {/* Table Diff */}
                  <div className="table-card" style={{ overflowX: 'auto' }}>
                    {dataDiff.counts.added === 0 && dataDiff.counts.removed === 0 && dataDiff.counts.changed === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <CheckCircle size={32} style={{ color: 'var(--accent2)', marginBottom: '10px' }} />
                        <p>Tablo içerikleri birebir aynı!</p>
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Durum</th>
                            {dataDiff.headers.map(h => <th key={h}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Deleted rows */}
                          {dataDiff.diffs.removed.map((item, idx) => (
                            <tr key={'del_' + idx} style={{ background: 'rgba(255, 107, 107, 0.05)' }}>
                              <td><span className="badge badge-red">- Silindi</span></td>
                              {dataDiff.headers.map(h => (
                                <td key={h} className="mono" style={{ color: 'var(--accent3)', textDecoration: 'line-through' }}>{String(item.row[h] ?? '')}</td>
                              ))}
                            </tr>
                          ))}

                          {/* Changed rows */}
                          {dataDiff.diffs.changed.map((item, idx) => (
                            <tr key={'ch_' + idx} style={{ background: 'rgba(245, 166, 35, 0.05)' }}>
                              <td><span className="badge badge-orange">~ Değişti</span></td>
                              {dataDiff.headers.map(h => {
                                const isCellChanged = item.changedCells[h];
                                if (isCellChanged) {
                                  return (
                                    <td key={h} className="mono" style={{ background: 'rgba(245, 166, 35, 0.15)', borderLeft: '2px solid var(--amber)' }}>
                                      <span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: '4px' }}>{String(isCellChanged.oldVal ?? '')}</span>
                                      <ArrowRight size={10} style={{ display: 'inline', margin: '0 4px' }} />
                                      <strong style={{ color: 'var(--accent4)' }}>{String(isCellChanged.newVal ?? '')}</strong>
                                    </td>
                                  );
                                }
                                return <td key={h} className="mono">{String(item.row[h] ?? '')}</td>;
                              })}
                            </tr>
                          ))}

                          {/* Added rows */}
                          {dataDiff.diffs.added.map((item, idx) => (
                            <tr key={'add_' + idx} style={{ background: 'rgba(0, 212, 170, 0.05)' }}>
                              <td><span className="badge badge-green">+ Yeni</span></td>
                              {dataDiff.headers.map(h => (
                                <td key={h} className="mono" style={{ color: 'var(--accent2)', fontWeight: 600 }}>{String(item.row[h] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  {(dataDiff.counts.added > 100 || dataDiff.counts.removed > 100 || dataDiff.counts.changed > 100) && (
                    <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
                      * Performans nedeniyle sadece ilk 100 değişiklik listelenmektedir.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
