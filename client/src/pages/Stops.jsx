import React, { useState, useCallback, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Eye } from 'lucide-react';
import { useLang } from '../App';
import { t } from '../i18n';
import { api } from '../lib/api';

function formatFare(v) {
  return v ? `${(v / 100).toFixed(2)} TL` : '—';
}

function LoadingState({ label }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

function StopRow({ stop }) {
  const lat = stop.lat_deg + stop.lat_min / 600000;
  const lon = stop.long_deg + stop.long_min / 600000;
  return (
    <tr>
      <td><span className="mono badge badge-blue">{stop.stop_id}</span></td>
      <td style={{ fontWeight: 500 }}>{stop.name || '—'}</td>
      <td><span className="mono text-muted">{lat.toFixed(5)}, {lon.toFixed(5)}</span></td>
      <td><span className={`badge ${stop.lineCount >= 10 ? 'badge-red' : stop.lineCount >= 5 ? 'badge-orange' : 'badge-green'}`}>{stop.lineCount}</span></td>
    </tr>
  );
}

export default function Stops() {
  const { lang } = useLang();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const limit = 100;

  const load = useCallback(() => {
    setLoading(true);
    api.getStops({ page, limit, search }).then(d => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div>
      <div className="page-header">
        <h1>{t(lang, 'stops')}</h1>
        <p>{data ? `${data.total.toLocaleString('tr-TR')} durak` : ''}</p>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h2>{t(lang, 'stops')}</h2>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
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
            <button type="submit" className="btn btn-primary">{t(lang, 'fareFilter')}</button>
          </form>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? <LoadingState label={t(lang, 'loading')} /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t(lang, 'stopId')}</th>
                  <th>{t(lang, 'stopName')}</th>
                  <th>{t(lang, 'coordinates')}</th>
                  <th>{t(lang, 'lines_label')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data || []).map(stop => <StopRow key={stop.stop_id} stop={stop} />)}
                {data?.data?.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{t(lang, 'noData')}</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <span className="pagination-info">
            {data ? `${((page - 1) * limit + 1).toLocaleString('tr-TR')}–${Math.min(page * limit, data.total).toLocaleString('tr-TR')} / ${data.total.toLocaleString('tr-TR')} ${t(lang, 'rows')}` : ''}
          </span>
          <div className="pagination-controls">
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {t(lang, 'page')} {page} {t(lang, 'of')} {totalPages}
            </span>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
