import React, { useState, useEffect, useRef } from 'react';
import { Database, Play, Download, BarChart2, Table, AlertCircle, Info } from 'lucide-react';
import { Chart } from 'chart.js/auto';
import { t } from '../i18n';
import { useLang } from '../App';
import * as XLSX from 'xlsx';

export default function SqlQueryPlayground() {
  const { lang } = useLang();
  const [dbs, setDbs] = useState([]);
  const [selectedDb, setSelectedDb] = useState('');
  
  const [tables, setTables] = useState([]);
  const [schema, setSchema] = useState({});
  const [sql, setSql] = useState('SELECT * FROM lines LIMIT 10;');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('table');
  const [chartX, setChartX] = useState('');
  const [chartY, setChartY] = useState('');
  const [chartType, setChartType] = useState('bar');
  
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  // Fetch DB List
  useEffect(() => {
    const fetchDbs = async () => {
      try {
        const res = await fetch('/api/db-compare/list');
        if (res.ok) {
          const data = await res.json();
          setDbs(data);
          if (data.length > 0) {
            setSelectedDb(data[0]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDbs();
  }, []);

  // Fetch Tables & Schemas when selectedDb changes
  useEffect(() => {
    if (!selectedDb) return;
    const fetchSchema = async () => {
      try {
        const res = await fetch(`/api/sql-playground/tables?db=${selectedDb}`);
        if (res.ok) {
          const data = await res.json();
          setTables(data.tables);
          setSchema(data.schema);
          // Set default SQL template based on tables found
          if (data.tables.length > 0) {
            setSql(`SELECT * FROM "${data.tables[0]}" LIMIT 10;`);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchema();
  }, [selectedDb]);

  // Run SQL Query
  const handleExecute = async () => {
    if (!selectedDb || !sql.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/sql-playground/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db: selectedDb, sql })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sorgu çalıştırılamadı.');
      }
      setResults(data);
      setActiveTab('table');
      
      // Auto-set default chart axis columns from result keys
      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        setChartX(keys[0] || '');
        const numKey = keys.find(k => !isNaN(Number(data[0][k]))) || keys[1] || keys[0] || '';
        setChartY(numKey);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Export results to Excel/CSV
  const handleExport = (format) => {
    if (!results || results.length === 0) return;
    
    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(results);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SQL_Query');
      XLSX.writeFile(wb, `query_result_${Date.now()}.xlsx`);
    } else {
      const headers = Object.keys(results[0]);
      const csvContent = [
        headers.join(','),
        ...results.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `query_result_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Render Chart when results or chart options change
  useEffect(() => {
    if (activeTab !== 'chart' || !results || results.length === 0 || !chartX || !chartY || !canvasRef.current) return;

    // Destroy existing chart instance
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = results.map(row => String(row[chartX] ?? ''));
    const dataValues = results.map(row => Number(row[chartY] ?? 0));
    
    const palette = ['#4f7cff', '#00d4aa', '#ff6b6b', '#f5a623', '#a855f7', '#06b6d4', '#ec4899', '#14b8a6', '#f43f5e', '#10b981'];
    const colors = labels.map((_, i) => palette[i % palette.length]);

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label: chartY,
          data: dataValues,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#e8edf8', font: { family: 'Inter' } }
          }
        },
        scales: chartType === 'pie' || chartType === 'doughnut' ? {} : {
          x: { ticks: { color: '#8fa3c8', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(99, 130, 255, 0.1)' } },
          y: { ticks: { color: '#8fa3c8', font: { family: 'JetBrains Mono', size: 10 } }, grid: { color: 'rgba(99, 130, 255, 0.1)' } }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [activeTab, results, chartX, chartY, chartType]);

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
          ⚡
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            SQL Sorgu Sihirbazı & Raporlayıcı
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            SQLite veritabanlarında salt-okunur SQL sorguları yazıp, grafikler oluşturun ve Excel çıktısı alın.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Side: Tables & Schema view */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
          <div>
            <label className="text-muted" style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Veritabanı Seç</label>
            <select 
              value={selectedDb} 
              onChange={(e) => setSelectedDb(e.target.value)}
              className="select-filter"
              style={{ width: '100%', height: '36px' }}
            >
              {dbs.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ height: '1px', background: 'var(--border)' }}></div>

          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Tablolar & Şemalar</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tables.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tablo bulunamadı.</p>
            ) : (
              tables.map(table => (
                <div key={table} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', background: 'var(--bg-surface)' }}>
                  <div className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-accent)', cursor: 'pointer' }} onClick={() => setSql(`SELECT * FROM "${table}" LIMIT 10;`)}>
                    📄 {table}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px', paddingLeft: '8px', borderLeft: '1px dashed var(--border)' }}>
                    {schema[table]?.map(col => (
                      <div key={col.name} className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{col.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{col.type.toLowerCase()}{col.pk ? ' (PK)' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: SQL Editor & Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Overhauled SQL Code Input (Vercel/Linear Style) */}
          <div className="sql-editor-container">
            <div className="sql-editor-header">
              <div className="sql-editor-header-left">
                <div className="sql-editor-glow-dot"></div>
                <span>query.sql</span>
              </div>
              <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>SQLite Read-Only</span>
            </div>
            
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="sql-editor-textarea"
              placeholder="SELECT * FROM table LIMIT 10;"
            />
            
            <div className="sql-editor-footer">
              <span style={{ fontSize: '11px', color: '#71717a', alignSelf: 'center', marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={12} /> Sol taraftaki tablo isimlerine tıklayarak şablon sorguları yükleyebilirsiniz.
              </span>
              <button 
                onClick={handleExecute}
                disabled={loading || !sql.trim()}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-md)' }}
              >
                {loading ? <div className="spinner" style={{ width: '12px', height: '12px', margin: 0 }}></div> : <Play size={12} />}
                Sorguyu Çalıştır
              </button>
            </div>
          </div>

          {error && (
            <div className="error-state" style={{ padding: '12px 16px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--accent3)' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Results panel */}
          {results && (
            <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                {/* Result Tabs */}
                <div className="tabs" style={{ margin: 0 }}>
                  <button className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>
                    <Table size={14} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />
                    Tablo Görünümü ({results.length} satır)
                  </button>
                  <button className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')} disabled={results.length === 0}>
                    <BarChart2 size={14} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />
                    Grafik Görünümü
                  </button>
                </div>

                {/* Export Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleExport('csv')}>
                    <Download size={12} /> CSV
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleExport('xlsx')}>
                    <Download size={12} /> Excel
                  </button>
                </div>
              </div>

              {results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  <Info size={24} style={{ marginBottom: '8px', color: 'var(--text-muted)' }} />
                  Sorgu çalıştı fakat herhangi bir sonuç dönmedi.
                </div>
              ) : (
                <>
                  {/* TABLE VIEW */}
                  {activeTab === 'table' && (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            {Object.keys(results[0]).map(k => <th key={k}>{k}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {results.slice(0, 100).map((row, rIdx) => (
                            <tr key={rIdx}>
                              {Object.keys(results[0]).map((k, cIdx) => (
                                <td key={cIdx} className="mono">{String(row[k] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {results.length > 100 && (
                        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
                          * Performans sebebiyle sadece ilk 100 satır listelenmektedir. Raporun tamamını indirmek için Excel veya CSV dışa aktarmayı kullanabilirsiniz.
                        </div>
                      )}
                    </div>
                  )}

                  {/* CHART VIEW */}
                  {activeTab === 'chart' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Chart selectors */}
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <label className="text-muted" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginRight: '6px' }}>X Ekseni</label>
                          <select value={chartX} onChange={(e) => setChartX(e.target.value)} className="select-filter" style={{ height: '32px' }}>
                            {Object.keys(results[0]).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-muted" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginRight: '6px' }}>Y Ekseni (Sayısal)</label>
                          <select value={chartY} onChange={(e) => setChartY(e.target.value)} className="select-filter" style={{ height: '32px' }}>
                            {Object.keys(results[0]).map(k => <option key={k} value={k}>{k}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-muted" style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginRight: '6px' }}>Grafik Tipi</label>
                          <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="select-filter" style={{ height: '32px' }}>
                            <option value="bar">Sütun (Bar)</option>
                            <option value="line">Çizgi (Line)</option>
                            <option value="pie">Pasta (Pie)</option>
                            <option value="doughnut">Halka (Doughnut)</option>
                          </select>
                        </div>
                      </div>

                      {/* Canvas Container */}
                      <div style={{ height: '280px', position: 'relative' }}>
                        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }}></canvas>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
