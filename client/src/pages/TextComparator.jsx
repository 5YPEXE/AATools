import React, { useState } from 'react';
import { Columns, ArrowRight, CheckCircle, Upload, AlertCircle } from 'lucide-react';
import { t } from '../i18n';
import { useLang } from '../App';

export default function TextComparator() {
  const { lang } = useLang();
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diffResult, setDiffResult] = useState(null);

  const handleFileUpload = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (target === 'text1') setText1(evt.target.result);
      else setText2(evt.target.result);
    };
    reader.readAsText(file);
  };

  const runDiff = () => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const n = lines1.length;
    const m = lines2.length;

    // LCS (Longest Common Subsequence) on line-level
    const dp = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (lines1[i - 1].trim() === lines2[j - 1].trim()) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    let i = n, j = m;
    const steps = [];

    while (i > 0 && j > 0) {
      if (lines1[i - 1].trim() === lines2[j - 1].trim()) {
        steps.push({ type: 'same', val1: lines1[i - 1], val2: lines2[j - 1] });
        i--;
        j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        steps.push({ type: 'removed', val1: lines1[i - 1], val2: '' });
        i--;
      } else {
        steps.push({ type: 'added', val1: '', val2: lines2[j - 1] });
        j--;
      }
    }

    while (i > 0) {
      steps.push({ type: 'removed', val1: lines1[i - 1], val2: '' });
      i--;
    }
    while (j > 0) {
      steps.push({ type: 'added', val1: '', val2: lines2[j - 1] });
      j--;
    }

    steps.reverse();

    // Stats
    const stats = { added: 0, removed: 0, same: 0 };
    steps.forEach(s => {
      if (s.type === 'added') stats.added++;
      else if (s.type === 'removed') stats.removed++;
      else stats.same++;
    });

    setDiffResult({ steps, stats });
  };

  const handleClear = () => {
    setText1('');
    setText2('');
    setDiffResult(null);
  };

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
          ⇄
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Metin ve Doküman Karşılaştırıcı
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            İki metin veya sözleşme dosyasını yükleyin, satır satır değişiklikleri yan yana görüntüleyin.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Source Text Input */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kaynak Metin (Dosya 1 - Eski)</h3>
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 10px', 
              background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' 
            }}>
              <Upload size={12} /> Dosya Yükle
              <input type="file" accept=".txt,.csv,.json,.xml" onChange={(e) => handleFileUpload(e, 'text1')} style={{ display: 'none' }} />
            </label>
          </div>
          <textarea
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            className="tool-textarea"
            placeholder="Eski metni buraya yapıştırın veya dosya yükleyin..."
          />
        </div>

        {/* Target Text Input */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hedef Metin (Dosya 2 - Yeni)</h3>
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 10px', 
              background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' 
            }}>
              <Upload size={12} /> Dosya Yükle
              <input type="file" accept=".txt,.csv,.json,.xml" onChange={(e) => handleFileUpload(e, 'text2')} style={{ display: 'none' }} />
            </label>
          </div>
          <textarea
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            className="tool-textarea"
            placeholder="Yeni metni buraya yapıştırın veya dosya yükleyin..."
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button className="btn btn-secondary" onClick={handleClear}>Sıfırla</button>
        <button 
          className="btn btn-primary" 
          onClick={runDiff}
          disabled={!text1.trim() && !text2.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Columns size={14} /> Karşılaştır
        </button>
      </div>

      {diffResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card" style={{ '--kpi-accent': 'var(--green)', '--kpi-accent-bg': 'rgba(0, 212, 170, 0.1)' }}>
              <div className="kpi-card-value">{diffResult.stats.added}</div>
              <div className="kpi-card-label">Eklenen Satırlar</div>
            </div>
            <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent3)', '--kpi-accent-bg': 'rgba(255, 107, 107, 0.1)' }}>
              <div className="kpi-card-value">{diffResult.stats.removed}</div>
              <div className="kpi-card-label">Silinen Satırlar</div>
            </div>
            <div className="kpi-card" style={{ '--kpi-accent': 'var(--fg-4)', '--kpi-accent-bg': 'rgba(148, 163, 184, 0.1)' }}>
              <div className="kpi-card-value">{diffResult.stats.same}</div>
              <div className="kpi-card-label">Eşleşen Satırlar</div>
            </div>
          </div>

          {/* Diff Table Grid */}
          <div className="table-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>Satır Karşılaştırma Sonucu</h3>
            
            {diffResult.stats.added === 0 && diffResult.stats.removed === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                <CheckCircle size={32} style={{ color: 'var(--accent2)', marginBottom: '8px' }} />
                Metinler tamamen aynı!
              </div>
            ) : (
              <div style={{ 
                border: '1px solid var(--border)', 
                borderRadius: 'var(--radius-md)', 
                overflow: 'hidden',
                background: 'var(--bg-base)'
              }}>
                {/* Visual side-by-side diff table list */}
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  <div>Durum</div>
                  <div>Kaynak (Eski)</div>
                  <div>Hedef (Yeni)</div>
                </div>

                <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  {diffResult.steps.map((s, idx) => {
                    let cls = '';
                    let label = '';
                    let color = 'inherit';
                    let bg = 'transparent';

                    if (s.type === 'added') {
                      label = '+';
                      color = 'var(--accent2)';
                      bg = 'rgba(0, 212, 170, 0.05)';
                    } else if (s.type === 'removed') {
                      label = '−';
                      color = 'var(--accent3)';
                      bg = 'rgba(255, 107, 107, 0.05)';
                    } else {
                      label = '=';
                      color = 'var(--text-secondary)';
                    }

                    return (
                      <div key={idx} style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '50px 1fr 1fr', 
                        borderBottom: '1px solid rgba(99, 130, 255, 0.06)', 
                        padding: '6px 8px',
                        background: bg,
                        alignItems: 'start'
                      }}>
                        <div className="mono" style={{ fontSize: '12px', fontWeight: 700, color: color }}>{label}</div>
                        <div className="mono" style={{ fontSize: '12px', wordBreak: 'break-all', color: s.type === 'removed' ? color : 'inherit', textDecoration: s.type === 'removed' ? 'line-through' : 'none', paddingRight: '8px' }}>
                          {s.val1}
                        </div>
                        <div className="mono" style={{ fontSize: '12px', wordBreak: 'break-all', color: s.type === 'added' ? color : 'inherit', paddingLeft: '8px' }}>
                          {s.val2}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
