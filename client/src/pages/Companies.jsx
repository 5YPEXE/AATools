import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Bus } from 'lucide-react';
import { useLang } from '../App';
import { t } from '../i18n';
import { api } from '../lib/api';
import { formatLineId } from '../lib/formatLineId';

function LoadingState({ label }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

function CompanyCard({ company, isSelected, onClick, lang }) {
  const maxLines = 30; // for bar width scaling
  const pct = Math.min(100, (company.lineCount / maxLines) * 100);

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? 'var(--bg-active)' : 'var(--bg-card)',
        border: `1px solid ${isSelected ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        cursor: 'pointer',
        transition: 'var(--transition)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: 3,
        width: `${pct}%`,
        background: isSelected ? 'var(--accent)' : 'var(--border-strong)',
        transition: 'width 0.4s ease',
        borderRadius: '0 2px 0 0'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={16} style={{ color: isSelected ? 'var(--accent-light)' : 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: isSelected ? 'var(--accent-light)' : 'var(--text-primary)' }}>
            Şirket #{company.companyId}
          </span>
        </div>
        <span className="badge badge-blue">{company.lineCount} hat</span>
      </div>

      {company.zones && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Zone: {company.zones.split(',').map(z => `Z${z}`).join(' · ')}
        </div>
      )}
    </div>
  );
}

export default function Companies() {
  const { lang } = useLang();
  const [companies, setCompanies] = useState(null);
  const [selected, setSelected] = useState(null);
  const [lines, setLines] = useState(null);
  const [linesLoading, setLinesLoading] = useState(false);

  useEffect(() => {
    api.getCompanies().then(setCompanies);
  }, []);

  const handleSelect = useCallback((company) => {
    if (selected?.companyId === company.companyId) {
      setSelected(null);
      setLines(null);
      return;
    }
    setSelected(company);
    setLinesLoading(true);
    api.getCompanyLines(company.companyId).then(data => {
      setLines(data);
      setLinesLoading(false);
    }).catch(() => setLinesLoading(false));
  }, [selected]);

  const totalLines = companies ? companies.reduce((s, c) => s + c.lineCount, 0) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>{t(lang, 'companies')}</h1>
        <p>
          {companies ? `${companies.length} şirket · ${totalLines.toLocaleString('tr-TR')} hat ataması` : ''}
        </p>
      </div>

      {/* Summary bar */}
      {companies && (
        <div style={{
          display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap'
        }}>
          {[
            { label: 'Toplam Şirket', value: companies.length, color: 'var(--accent)' },
            { label: 'Toplam Hat Ataması', value: totalLines, color: 'var(--accent2)' },
            { label: 'En Büyük Şirket', value: `#${companies[0]?.companyId} (${companies[0]?.lineCount} hat)`, color: 'var(--accent4)' },
          ].map((item, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '12px 20px', flex: 1, minWidth: 160
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value?.toLocaleString?.('tr-TR') ?? item.value}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Company grid */}
        <div>
          {!companies ? (
            <LoadingState label={t(lang, 'loading')} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {companies.map(c => (
                <CompanyCard
                  key={c.companyId}
                  company={c}
                  isSelected={selected?.companyId === c.companyId}
                  onClick={() => handleSelect(c)}
                  lang={lang}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="detail-panel" style={{ position: 'sticky', top: 20 }}>
            <div className="detail-header">
              <div className="detail-header-icon"><Building2 size={22} /></div>
              <div className="detail-header-info" style={{ flex: 1 }}>
                <h2>Şirket #{selected.companyId}</h2>
                <p>{selected.lineCount} hat · {selected.zones?.split(',').length} zone</p>
              </div>
              <button onClick={() => { setSelected(null); setLines(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {linesLoading ? (
                <LoadingState label={t(lang, 'loading')} />
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t(lang, 'lineId')}</th>
                      <th>{t(lang, 'lineName')}</th>
                      <th>Zone</th>
                      <th>{t(lang, 'stopCount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(lines || []).map(l => (
                      <tr key={l.line_id}>
                        <td><span className="mono badge badge-blue">{formatLineId(l.line_id)}</span></td>
                        <td style={{ fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{l.name}</td>
                        <td><span className="badge badge-orange">Z{l.zone_id}</span></td>
                        <td><span className="badge badge-green">{l.stopCount}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
