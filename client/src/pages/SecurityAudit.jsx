import React, { useState, useMemo } from 'react';
import { Shield, Search, FileSpreadsheet, AlertTriangle, Eye, RefreshCw, Trash2, Calendar, User, Activity, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KEYS_STORE, logActivity } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(KEYS_STORE.activity)) || [];
  } catch {
    return [];
  }
}

export default function SecurityAudit() {
  const { getAllUsers, currentUser } = useAuth();
  const allUsers = getAllUsers();
  
  const [logs, setLogs] = useState(getLogs);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const refreshLogs = () => {
    setLogs(getLogs());
  };

  const clearLogs = () => {
    if (window.confirm('Tüm aktivite günlüklerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      localStorage.setItem(KEYS_STORE.activity, JSON.stringify([]));
      logActivity(currentUser.id, 'audit_logs_cleared', 'security', currentUser.id, { clearedBy: currentUser.name });
      refreshLogs();
    }
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const user = allUsers.find(u => u.id === log.userId);
      const userName = user ? user.name : '';
      const matchesSearch = 
        log.userId?.toLowerCase().includes(search.toLowerCase()) ||
        userName.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(log.details || {}).toLowerCase().includes(search.toLowerCase());

      const matchesAction = !actionFilter || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, search, actionFilter, allUsers]);

  // Activity statistics for chart
  const chartData = useMemo(() => {
    const counts = {};
    logs.forEach(log => {
      counts[log.action] = (counts[log.action] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([action, count]) => ({
        action: action.replace('user_', '').replace('_', ' ').toUpperCase(),
        count
      }))
      .slice(0, 8);
  }, [logs]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredLogs.length === 0) return;
    
    const formatted = filteredLogs.map(log => {
      const user = allUsers.find(u => u.id === log.userId);
      return {
        'Açıklama/ID': log.id,
        'İşlemi Yapan': user ? `${user.name} (${user.email})` : log.userId,
        'Eylem': log.action,
        'Varlık Tipi': log.entityType,
        'Varlık ID': log.entityId,
        'Detaylar': JSON.stringify(log.details),
        'Tarih/Saat': new Date(log.timestamp).toLocaleString('tr-TR'),
      };
    });

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sistem_Loglari');
    XLSX.writeFile(wb, `aatools_audit_logs_${Date.now()}.xlsx`);
  };

  // Unique actions list for filter
  const actionTypes = useMemo(() => {
    const set = new Set(logs.map(l => l.action));
    return Array.from(set);
  }, [logs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="sidebar-logo-icon" style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, var(--accent3), var(--purple))',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justify: 'center',
            fontSize: '18px'
          }}>
            <Shield size={18} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Güvenlik & Sistem Denetim Günlüğü
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Kullanıcı eylemlerini, şifre değişimlerini ve veri güncellemelerini buradan izleyin.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={refreshLogs} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <RefreshCw size={14} /> Yenile
          </button>
          <button className="btn btn-primary" onClick={handleExportExcel} disabled={filteredLogs.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <FileSpreadsheet size={14} /> Excel'e Aktar
          </button>
          <button className="btn-primary" onClick={clearLogs} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--accent3)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'white', fontWeight: 600 }}>
            <Trash2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Günlüğü Temizle
          </button>
        </div>
      </div>

      {/* Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        
        {/* Recharts Activity Distribution */}
        <div className="chart-card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} /> En Sık Yapılan Sistem Eylemleri
          </h3>
          {chartData.length === 0 ? (
            <div style={{ display: 'flex', height: '180px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              İstatistik verisi bulunamadı.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="action" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} />
                <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent)' : 'var(--purple)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* System Health / Quick Stats */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Genel Özet
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Toplam Eylem Günlüğü</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{logs.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Filtrelenen İşlemler</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>{filteredLogs.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Aktif Sistem Kullanıcıları</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent2)' }}>{allUsers.filter(u => u.isActive).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="chart-card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="search-input"
              style={{ paddingLeft: '36px', width: '100%' }}
              placeholder="Yapan kişi, eylem veya detaylarda ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="select-filter"
            style={{ width: '200px' }}
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
          >
            <option value="">Tüm Eylemler</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="table-card" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tarih & Saat</th>
              <th>Kullanıcı</th>
              <th>Eylem</th>
              <th>Varlık Tipi</th>
              <th>Detaylar</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                  Herhangi bir sistem denetim kaydı bulunamadı.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => {
                const user = allUsers.find(u => u.id === log.userId);
                
                // Color badges based on action type
                let actionBadgeColor = 'badge-blue';
                if (log.action?.includes('delete') || log.action?.includes('clear') || log.action?.includes('error')) {
                  actionBadgeColor = 'badge-red';
                } else if (log.action?.includes('created') || log.action?.includes('login')) {
                  actionBadgeColor = 'badge-green';
                } else if (log.action?.includes('updated')) {
                  actionBadgeColor = 'badge-orange';
                }

                return (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={12} />
                        {new Date(log.timestamp).toLocaleString('tr-TR')}
                      </span>
                    </td>
                    <td>
                      {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UserAvatar user={user} size={22} />
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{user.name}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                          <User size={12} />
                          <span style={{ fontSize: '12px' }}>{log.userId || 'Sistem'}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${actionBadgeColor}`} style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {log.entityType || '—'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span title={JSON.stringify(log.details)}>
                        {Object.keys(log.details || {}).length > 0 
                          ? Object.entries(log.details).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' | ') 
                          : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
