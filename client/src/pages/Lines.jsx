import React, { useState, useCallback, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Bus, ArrowRight } from 'lucide-react';
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

function LineDetailPanel({ lineId, onClose, lang }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dir, setDir] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.getLine(lineId).then(d => { setDetail(d); setLoading(false); }).catch(() => setLoading(false));
  }, [lineId]);

  if (loading) {
    return (
      <div className="chart-card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div className="drawer-header" style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <div className="drawer-header-left">
            <div className="drawer-header-icon" style={{ width: 36, height: 36, fontSize: 18 }}>🚌</div>
            <div className="drawer-title-group">
              <h2>Hat Detayı</h2>
              <p>{t(lang, 'loading')}</p>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={onClose} style={{ width: 28, height: 28, fontSize: 14 }}>✕</button>
        </div>
        <div className="drawer-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flex: 1 }}>
          <LoadingState label={t(lang, 'loading')} />
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const dirStops = (detail.stops || []).filter(s => s.direction === dir).sort((a, b) => a.position - b.position);

  return (
    <div className="chart-card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      <div className="drawer-header" style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
        <div className="drawer-header-left">
          <div className="drawer-header-icon" style={{ width: 36, height: 36, fontSize: 18 }}>🚌</div>
          <div className="drawer-title-group">
            <h2>#{formatLineId(detail.line_id)}</h2>
            <p style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{detail.name}</p>
          </div>
        </div>
        <button className="drawer-close-btn" onClick={onClose} style={{ width: 28, height: 28, fontSize: 14 }}>✕</button>
      </div>

      <div className="drawer-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div className="drawer-meta-grid" style={{ marginBottom: 20 }}>
          <div className="meta-chip" style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <span className="meta-chip-label" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t(lang, 'zoneId')}</span>
            <span className="meta-chip-value" style={{ fontWeight: 700 }}><span className="badge badge-orange">Z{detail.zone_id}</span></span>
          </div>
          <div className="meta-chip" style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <span className="meta-chip-label" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t(lang, 'stopCount')}</span>
            <span className="meta-chip-value" style={{ fontWeight: 700 }}>{dirStops.length} / {(detail.stops || []).length}</span>
          </div>
        </div>

        {detail.companies?.length > 0 && (
          <div className="drawer-section" style={{ background: 'var(--bg-hover)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
            <span className="meta-chip-label" style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{t(lang, 'companies_label')}</span>
            <span className="meta-chip-value" style={{ fontWeight: 600 }}>{detail.companies.join(', ')}</span>
          </div>
        )}

        {/* Direction selector */}
        <div className="drawer-section" style={{ marginBottom: 20 }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button className={`tab-btn${dir === 0 ? ' active' : ''}`} onClick={() => setDir(0)}>
              {t(lang, 'forward')} ({(detail.stops || []).filter(s => s.direction === 0).length})
            </button>
            <button className={`tab-btn${dir === 1 ? ' active' : ''}`} onClick={() => setDir(1)}>
              {t(lang, 'return')} ({(detail.stops || []).filter(s => s.direction === 1).length})
            </button>
          </div>
        </div>

        {/* Stops list */}
        <div className="drawer-section">
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{t(lang, 'stops')}</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t(lang, 'stopId')}</th>
                <th>{t(lang, 'stopName')}</th>
              </tr>
            </thead>
            <tbody>
              {dirStops.map((s, i) => (
                <tr key={`${s.stop_id}-${i}`}>
                  <td><span className="mono text-muted">{s.position}</span></td>
                  <td><span className="mono badge badge-blue">{s.stop_id}</span></td>
                  <td style={{ fontWeight: 500, fontSize: 12 }}>{s.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Lines() {
  const { lang } = useLang();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [zone, setZone] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState(null);
  const [zones, setZones] = useState([]);
  const limit = 50;

  useEffect(() => {
    api.getZoneStats().then(zs => setZones(zs.map(z => z.zone_id)));
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit, search };
    if (zone !== '') params.zone = zone;
    api.getLines(params).then(d => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, search, zone]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1>{t(lang, 'lines')}</h1>
        <p>{data ? `${data.total.toLocaleString('tr-TR')} hat` : ''}</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left Column: Table */}
        <div style={{ flex: selectedLine ? '0 0 55%' : '1', transition: 'flex 0.3s cubic-bezier(0.16, 1, 0.3, 1)', minWidth: 0 }}>
          <div className="table-card">
        <div className="table-toolbar">
          <h2>{t(lang, 'lines')}</h2>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="search-input"
                style={{ paddingLeft: 36 }}
                placeholder={t(lang, 'search')}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <select
              className="select-filter"
              value={zone}
              onChange={e => { setZone(e.target.value); setPage(1); }}
            >
              <option value="">{t(lang, 'allZones')}</option>
              {zones.map(z => <option key={z} value={z}>Zone {z}</option>)}
            </select>
            <button type="submit" className="btn btn-primary">{t(lang, 'fareFilter')}</button>
          </form>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? <LoadingState label={t(lang, 'loading')} /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t(lang, 'lineId')}</th>
                  <th>{t(lang, 'lineName')}</th>
                  <th>{t(lang, 'zoneId')}</th>
                  <th>{t(lang, 'stopCount')}</th>
                  <th>{t(lang, 'companies_label')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data?.data || []).map(line => (
                  <tr
                    key={line.line_id}
                    onClick={() => setSelectedLine(selectedLine === line.line_id ? null : line.line_id)}
                    style={{ background: selectedLine === line.line_id ? 'var(--bg-active)' : undefined }}
                  >
                    <td><span className="mono badge badge-blue">{formatLineId(line.line_id)}</span></td>
                    <td style={{ fontWeight: 500, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {line.name}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}><span className="badge badge-orange">Z{line.zone_id}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}><span className="badge badge-green">{line.stopCount}</span></td>
                    <td>
                      {line.companyIds ? (
                        <span className="mono text-muted" style={{ fontSize: 11 }}>{line.companyIds}</span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-accent)', fontSize: 12 }}>
                        {selectedLine === line.line_id ? '▲ Kapat' : '▼ Detay'}
                      </span>
                    </td>
                  </tr>
                ))}
                {data?.data?.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{t(lang, 'noData')}</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <span className="pagination-info">
            {data ? `${((page-1)*limit+1).toLocaleString('tr-TR')}–${Math.min(page*limit,data.total).toLocaleString('tr-TR')} / ${data.total.toLocaleString('tr-TR')} ${t(lang,'rows')}` : ''}
          </span>
          <div className="pagination-controls">
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1}>Önceki</button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t(lang,'page')} {page} / {totalPages}</span>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page>=totalPages}>Sonraki</button>
          </div>
        </div>
      </div>
      </div>

        {/* Right Column: Sticky Detail Panel */}
        {selectedLine && (
          <div style={{ flex: '0 0 calc(45% - 20px)', position: 'sticky', top: '88px', animation: 'drawerSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            <LineDetailPanel lineId={selectedLine} onClose={() => setSelectedLine(null)} lang={lang} />
          </div>
        )}
      </div>
    </div>
  );
}
