import React, { useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Bus, MapPin, Building2, Layers, CreditCard, List, ArrowLeftRight, TrendingUp, ClipboardList, AlertCircle, Calendar } from 'lucide-react';
import { useLang } from '../App';
import { t } from '../i18n';
import { useApi } from '../lib/useApi';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { KEYS_STORE } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useServerStatus, OfflineState } from '../components/ServerStatus';

const CHART_COLORS = ['#4f7cff', '#00d4aa', '#f5a623', '#ff6b6b', '#a855f7', '#38bdf8', '#fb7185', '#34d399'];

function formatFare(v) {
  return `${(v / 100).toFixed(2)} TL`;
}

function KPICard({ icon, value, label, color = '#4f7cff', bgColor }) {
  const style = {
    '--kpi-accent': color,
    '--kpi-accent-bg': bgColor || `${color}22`,
  };
  return (
    <div className="kpi-card" style={style}>
      <div className="kpi-card-icon">{icon}</div>
      <div className="kpi-card-value">{value?.toLocaleString('tr-TR') ?? '—'}</div>
      <div className="kpi-card-label">{label}</div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="chart-card">
      <div className="loading-state">
        <div className="spinner" />
      </div>
    </div>
  );
}

function OfflineCard({ title }) {
  return (
    <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 160, color: 'var(--text-tertiary)' }}>
      <span style={{ fontSize: 28 }}>🔌</span>
      <span style={{ fontWeight: 700, fontSize: 13 }}>{title}</span>
      <span style={{ fontSize: 12 }}>Sunucu bağlı değil</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px'
      }}>
        <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: 600 }}>
            {p.value?.toLocaleString('tr-TR')}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function getMyTasks(userId) {
  try {
    const tasks = JSON.parse(localStorage.getItem(KEYS_STORE.tasks)) || [];
    return tasks.filter(t => t.assigneeId === userId && t.status !== 'done');
  } catch { return []; }
}

export default function Dashboard() {
  const { lang } = useLang();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { isOnline } = useServerStatus();

  const summaryFn = useCallback(() => api.getSummary(), []);
  const zonesFn = useCallback(() => api.getZoneStats(), []);
  const faresDistFn = useCallback(() => api.getFaresDistribution(), []);
  const timeZoneFn = useCallback(() => api.getTimeZoneStats(), []);
  const companyFn = useCallback(() => api.getCompanyStats(), []);

  const { data: summary, loading: sumLoading, error: sumError } = useApi(summaryFn);
  const { data: zones } = useApi(zonesFn);
  const { data: faresDist } = useApi(faresDistFn);
  const { data: timeZones } = useApi(timeZoneFn);
  const { data: companies } = useApi(companyFn);

  const myTasks = currentUser ? getMyTasks(currentUser.id) : [];
  const overdueMyTasks = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());
  const urgentMyTasks = myTasks
    .sort((a, b) => {
      const prioOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (prioOrder[a.priority] || 2) - (prioOrder[b.priority] || 2);
    })
    .slice(0, 5);

  const kpiItems = summary ? [
    { icon: <Bus size={20} />,          value: summary.totalLines,        label: t(lang, 'totalLines'),       color: '#4f7cff' },
    { icon: <MapPin size={20} />,       value: summary.totalStops,        label: t(lang, 'totalStops'),       color: '#00d4aa' },

    { icon: <Layers size={20} />,       value: summary.totalZones,        label: t(lang, 'totalZones'),       color: '#f5a623' },
    { icon: <CreditCard size={20} />,   value: summary.totalCardTypes,    label: t(lang, 'totalCardTypes'),   color: '#38bdf8' },
    { icon: <List size={20} />,         value: summary.totalFareRules,    label: t(lang, 'totalFareRules'),   color: '#fb7185' },
    { icon: <ArrowLeftRight size={20} />,value: summary.totalTransferRules,label: t(lang, 'totalTransferRules'),color: '#34d399' },
    { icon: <TrendingUp size={20} />,   value: summary.fareRange?.avg,    label: t(lang, 'avgFare') + ' (kr)', color: '#f5a623' },
  ] : [];

  // Top 15 zones
  const topZones = (zones || []).slice(0, 15).map(z => ({
    name: `Z${z.zone_id}`,
    [t(lang, 'lineCount')]: z.lineCount
  }));

  // Top 10 companies
  const topCompanies = (companies || []).slice(0, 10).map(c => ({
    name: `Şirket ${c.companyId}`,
    value: c.lineCount
  }));

  return (
    <div>
      <div className="page-header">
        <h1>{t(lang, 'dashboard')}</h1>
        <p>{t(lang, 'appSubtitle')} — Ankara</p>
      </div>

      {/* KPI Grid — show offline state if server is down */}
      {sumLoading ? (
        <div className="loading-state" style={{ marginBottom: 28 }}>
          <div className="spinner" />
          <span>{t(lang, 'loading')}</span>
        </div>
      ) : sumError || !isOnline ? (
        <div style={{ marginBottom: 28 }}>
          <OfflineState message="Dashboard grafikleri için Express sunucusunun çalışması gerekiyor." />
        </div>
      ) : (
        <div className="kpi-grid">
          {kpiItems.map((item, i) => (
            <KPICard key={i} {...item} />
          ))}
        </div>
      )}

      {/* Fare Range Banner */}
      {summary?.fareRange && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '16px 24px',
          display: 'flex', gap: 32, alignItems: 'center',
          marginBottom: 20, flexWrap: 'wrap'
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {t(lang, 'fareRange')}
          </div>
          {[
            { label: t(lang, 'minFare'), value: formatFare(summary.fareRange.min), color: '#00d4aa' },
            { label: t(lang, 'avgFare'), value: formatFare(summary.fareRange.avg), color: '#f5a623' },
            { label: t(lang, 'maxFare'), value: formatFare(summary.fareRange.max), color: '#ff6b6b' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* My Tasks Widget */}
      {currentUser && (
        <div style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="chart-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={16} /> Bana Atananlar
              </h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{myTasks.length} açık</span>
                {overdueMyTasks.length > 0 && (
                  <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                    <AlertCircle size={12} style={{ display: 'inline', marginRight: 3 }} />
                    {overdueMyTasks.length} gecikmiş
                  </span>
                )}
              </div>
            </div>
            {urgentMyTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                ✅ Atanmış açık göreviniz yok.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {urgentMyTasks.map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px',
                        background: 'var(--surface-2)',
                        borderRadius: 8,
                        border: isOverdue ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                      }}
                      onClick={() => navigate('/projects')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.title}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <StatusBadge status={task.status} />
                          {task.dueDate && (
                            <span style={{ fontSize: 11, color: isOverdue ? '#ef4444' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Calendar size={10} />
                              {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <PriorityBadge priority={task.priority} showLabel={false} />
                    </div>
                  );
                })}
                {myTasks.length > 5 && (
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 12, padding: '6px', marginTop: 4 }}
                    onClick={() => navigate('/projects')}
                  >
                    +{myTasks.length - 5} görev daha → Görevlere git
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Stats for tasks */}
          <div className="chart-card">
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} /> Bu Haftaki Özet
            </h3>
            {(() => {
              try {
                const allTasks = JSON.parse(localStorage.getItem(KEYS_STORE.tasks)) || [];
                const weekAgo = new Date(Date.now() - 7 * 86400000);
                const completedThisWeek = allTasks.filter(t =>
                  t.completedAt && new Date(t.completedAt) >= weekAgo
                ).length;
                const createdThisWeek = allTasks.filter(t =>
                  t.createdAt && new Date(t.createdAt) >= weekAgo
                ).length;
                const totalOpen = allTasks.filter(t => t.status !== 'done').length;
                const items = [
                  { label: 'Bu hafta tamamlanan', value: completedThisWeek, color: '#10b981' },
                  { label: 'Bu hafta oluşturulan', value: createdThisWeek, color: '#6366f1' },
                  { label: 'Toplam açık görev', value: totalOpen, color: '#f59e0b' },
                  { label: 'Bana atanan açık', value: myTasks.length, color: '#3b82f6' },
                ];
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: item.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontWeight: 800, fontSize: 16, color: item.color }}>{item.value}</span>
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                );
              } catch { return null; }
            })()}
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="charts-grid" style={{ marginBottom: 20 }}>
        <div className="chart-card">
          <h3>{t(lang, 'zoneDistribution')}</h3>
          {topZones.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topZones} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.08)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={t(lang, 'lineCount')} fill="#4f7cff" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <OfflineCard title={t(lang, 'zoneDistribution')} />}
        </div>


        <div className="chart-card">
          <h3>{t(lang, 'fareDistribution')}</h3>
          {faresDist ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={faresDist} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.08)" />
                <XAxis dataKey="range" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} angle={-30} textAnchor="end" height={48} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#00d4aa" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="spinner" style={{ margin: '40px auto' }} />}
        </div>

        <div className="chart-card">
          <h3>{t(lang, 'timeZoneRules')}</h3>
          {timeZones ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timeZones.map(tz => ({ name: `TZ${tz.time_zone_id}`, [t(lang, 'count')]: tz.ruleCount }))} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,130,255,0.08)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={t(lang, 'count')} fill="#a855f7" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="spinner" style={{ margin: '40px auto' }} />}
        </div>
      </div>


    </div>
  );
}
