import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useLang } from '../App';
import { t } from '../i18n';
import { api } from '../lib/api';
import { formatLineId } from '../lib/formatLineId';

function formatFare(v) {
  return v != null ? `${(v / 100).toFixed(2)} TL` : '—';
}

function LoadingState({ label }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

function TransferDiscountsTab({ lang }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 100;

  const load = useCallback(() => {
    setLoading(true);
    api.getTransfers({ page, limit }).then(d => {
      setData(d.data);
      setTotal(d.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{total.toLocaleString('tr-TR')} transfer kuralı</span>
      </div>
      {loading ? <LoadingState label={t(lang, 'loading')} /> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Hat</th>
                <th>Önceki Hat</th>
                <th>Transfer No</th>
                <th>Süre (dk)</th>
                <th>Eşik (dk)</th>
                <th>% İndirim</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((r, i) => (
                <tr key={i}>
                  <td><span className="mono badge badge-blue">{formatLineId(r.line_id)}</span></td>
                  <td><span className="mono badge badge-purple">{formatLineId(r.previous_line_id)}</span></td>
                  <td><span className="badge badge-orange">{r.transfer_num}</span></td>
                  <td>{r.interval}</td>
                  <td>{r.threshold_time}</td>
                  <td><span className="fare-value">{r.percent === 1 ? '100%' : `${r.percent * 100}%`}</span></td>
                  <td><span className="mono text-muted">{r.flags}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <span className="pagination-info">{t(lang, 'page')} {page} {t(lang, 'of')} {totalPages}</span>
        <div className="pagination-controls">
          <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1}><ChevronLeft size={16} /></button>
          <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page>=totalPages}><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function BankCommissionTab({ lang }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.getBankCommission().then(setData); }, []);

  if (!data) return <LoadingState label={t(lang, 'loading')} />;
  return (
    <div style={{ padding: 20 }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Yükleme miktarına göre banka komisyon aralıkları
      </p>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {data.map((row, i) => (
          <div key={i} style={{
            background: 'var(--bg-hover)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '16px 20px'
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              ≤ {formatFare(row.range)} yükleme
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent4)' }}>
              {formatFare(row.commission)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>komisyon</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Fares() {
  const { lang } = useLang();
  const [tab, setTab] = useState('ticket');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ cardType: '', stopType: '', timeZone: '' });
  const [filterOptions, setFilterOptions] = useState(null);
  const limit = 100;

  useEffect(() => {
    api.getFareFilters().then(setFilterOptions);
  }, []);

  const load = useCallback(() => {
    if (tab !== 'ticket') return;
    setLoading(true);
    const params = { page, limit };
    if (filters.cardType !== '') params.cardType = filters.cardType;
    if (filters.stopType !== '') params.stopType = filters.stopType;
    if (filters.timeZone !== '') params.timeZone = filters.timeZone;
    api.getFares(params).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [page, filters, tab]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filters]);

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div>
      <div className="page-header">
        <h1>{t(lang, 'fares')}</h1>
        <p>Tarife kuralları, transfer indirimleri ve banka komisyonları</p>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'ticket' ? ' active' : ''}`} onClick={() => setTab('ticket')}>
          Bilet Tarifeleri
        </button>
        <button className={`tab-btn${tab === 'transfers' ? ' active' : ''}`} onClick={() => setTab('transfers')}>
          {t(lang, 'transferDiscounts')}
        </button>
        <button className={`tab-btn${tab === 'bank' ? ' active' : ''}`} onClick={() => setTab('bank')}>
          {t(lang, 'bankCommission')}
        </button>
      </div>

      {tab === 'ticket' && (
        <div className="table-card">
          <div className="table-toolbar">
            <h2>Bilet Tarifeleri</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Filter size={15} style={{ color: 'var(--text-muted)' }} />
              <select className="select-filter" value={filters.cardType} onChange={e => setFilters(f => ({...f, cardType: e.target.value}))}>
                <option value="">{t(lang, 'allCardTypes')}</option>
                {(filterOptions?.cardTypes || []).map(v => <option key={v} value={v}>Kart {v}</option>)}
              </select>
              <select className="select-filter" value={filters.timeZone} onChange={e => setFilters(f => ({...f, timeZone: e.target.value}))}>
                <option value="">{t(lang, 'allTimeZones')}</option>
                {(filterOptions?.timeZones || []).map(v => <option key={v} value={v}>TZ {v}</option>)}
              </select>
              <select className="select-filter" value={filters.stopType} onChange={e => setFilters(f => ({...f, stopType: e.target.value}))}>
                <option value="">{t(lang, 'allStopTypes')}</option>
                {(filterOptions?.stopTypes || []).slice(0, 50).map(v => <option key={v} value={v}>Stop {v}</option>)}
              </select>
              {(filters.cardType || filters.timeZone || filters.stopType) && (
                <button className="btn btn-ghost" onClick={() => setFilters({ cardType: '', stopType: '', timeZone: '' })}>
                  × Temizle
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {loading ? <LoadingState label={t(lang, 'loading')} /> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t(lang, 'stop_type')}</th>
                    <th>{t(lang, 'timeZoneId')}</th>
                    <th>{t(lang, 'cardTypeId')}</th>
                    <th>{t(lang, 'fareId')}</th>
                    <th>{t(lang, 'fare')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.data || []).map((row, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap' }}><span className="badge badge-purple">{row.stop_type}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}><span className="badge badge-blue">TZ {row.time_zone_id}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}><span className="badge badge-orange">Kart {row.card_type_id}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}><span className="mono text-muted">{row.fare_id}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}><span className="fare-value">{formatFare(row.fare)}</span></td>
                    </tr>
                  ))}
                  {data?.data?.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{t(lang, 'noData')}</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="pagination">
            <span className="pagination-info">
              {data ? `${data.total.toLocaleString('tr-TR')} ${t(lang, 'rows')}` : ''}
            </span>
            <div className="pagination-controls">
              <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page<=1}><ChevronLeft size={16} /></button>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t(lang,'page')} {page} {t(lang,'of')} {totalPages}</span>
              <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page>=totalPages}><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {tab === 'transfers' && (
        <div className="table-card">
          <TransferDiscountsTab lang={lang} />
        </div>
      )}

      {tab === 'bank' && (
        <div className="table-card">
          <BankCommissionTab lang={lang} />
        </div>
      )}
    </div>
  );
}
