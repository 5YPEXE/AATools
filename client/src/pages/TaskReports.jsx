import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { KEYS_STORE } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

function getProjects() { try { return JSON.parse(localStorage.getItem(KEYS_STORE.projects)) || []; } catch { return []; } }
function getTasks() { try { return JSON.parse(localStorage.getItem(KEYS_STORE.tasks)) || []; } catch { return []; } }

const STATUS_COLORS = {
  backlog: '#6b7280', todo: '#3b82f6', in_progress: '#f59e0b', review: '#8b5cf6', done: '#10b981'
};
const STATUS_LABELS = { backlog: 'Backlog', todo: 'Yapılacak', in_progress: 'Yapılıyor', review: 'İncelemede', done: 'Tamamlandı' };
const PRIO_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };

export default function TaskReports() {
  const { getAllUsers, currentUser } = useAuth();
  const allUsers = getAllUsers();
  const projects = getProjects();
  const tasks = getTasks();

  // Overall stats
  const total = tasks.length;
  const done  = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;

  // Status distribution (pie)
  const statusDist = useMemo(() => {
    const counts = {};
    tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v, color: STATUS_COLORS[k] }));
  }, [tasks]);

  // Per-project progress (bar)
  const projectProgress = useMemo(() => {
    return projects.filter(p => !p.isArchived).map(p => {
      const pt = tasks.filter(t => t.projectId === p.id);
      const pdone = pt.filter(t => t.status === 'done').length;
      return {
        name: p.title.length > 16 ? p.title.slice(0, 14) + '…' : p.title,
        total: pt.length,
        tamamlandi: pdone,
        'açık': pt.length - pdone,
        color: p.color,
      };
    }).filter(p => p.total > 0);
  }, [projects, tasks]);

  // Per-user workload
  const userWorkload = useMemo(() => {
    return allUsers.filter(u => u.isActive).map(u => {
      const assigned = tasks.filter(t => t.assigneeId === u.id && t.status !== 'done');
      const completed = tasks.filter(t => t.assigneeId === u.id && t.status === 'done').length;
      const overdueCount = assigned.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;
      return { user: u, open: assigned.length, completed, overdue: overdueCount };
    }).filter(u => u.open + u.completed > 0)
      .sort((a, b) => b.open - a.open);
  }, [allUsers, tasks]);

  // Priority distribution
  const prioDist = useMemo(() => {
    const counts = {};
    tasks.filter(t => t.status !== 'done').forEach(t => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: k, value: v, color: PRIO_COLORS[k] }));
  }, [tasks]);

  // Overdue tasks
  const overdueList = tasks
    .filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 10);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Raporlar</h1>
          <p className="page-subtitle">Proje ve görev performansına genel bakış</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-stats" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}><TrendingUp size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Toplam Görev</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}><CheckCircle size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{done}</div>
            <div className="stat-label">Tamamlanan</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}><Clock size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{inProgress}</div>
            <div className="stat-label">Yapılıyor</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}><AlertTriangle size={20} /></div>
          <div className="stat-info">
            <div className="stat-value">{overdue}</div>
            <div className="stat-label">Gecikmiş</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Status Pie */}
        <div className="chart-card">
          <div className="chart-title">Statü Dağılımı</div>
          {statusDist.length === 0 ? (
            <div className="empty-state-sm">Veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {statusDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Priority Pie */}
        <div className="chart-card">
          <div className="chart-title">Açık Görevlerde Öncelik Dağılımı</div>
          {prioDist.length === 0 ? (
            <div className="empty-state-sm">Veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={prioDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {prioDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Project Progress Bar */}
      {projectProgress.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 20 }}>
          <div className="chart-title">Proje Bazlı İlerleme</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={projectProgress} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="tamamlandi" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="açık" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* User Workload */}
        <div className="chart-card">
          <div className="chart-title">Kişi Bazlı Yük Dağılımı</div>
          {userWorkload.length === 0 ? (
            <div className="empty-state-sm">Veri yok</div>
          ) : (
            <div className="workload-list">
              {userWorkload.map(({ user, open, completed, overdue }) => (
                <div key={user.id} className="workload-row">
                  <UserAvatar user={user} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{user.name}</div>
                    <div className="workload-bar-bg">
                      <div className="workload-bar-fill" style={{
                        width: `${Math.min(100, (open / Math.max(1, userWorkload[0].open)) * 100)}%`,
                        background: overdue > 0 ? '#ef4444' : 'var(--accent)',
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {open} açık · {completed} tamamlanan
                    {overdue > 0 && <span style={{ color: '#ef4444' }}> · {overdue} gecikmiş</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Tasks */}
        <div className="chart-card">
          <div className="chart-title">Gecikmiş Görevler</div>
          {overdueList.length === 0 ? (
            <div className="empty-state-sm" style={{ color: '#10b981' }}>✅ Gecikmiş görev yok!</div>
          ) : (
            <div className="overdue-list">
              {overdueList.map(task => {
                const assignee = getAllUsers().find(u => u.id === task.assigneeId);
                const days = Math.round((new Date() - new Date(task.dueDate)) / 86400000);
                return (
                  <div key={task.id} className="overdue-item">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{task.title}</div>
                      <div style={{ fontSize: 11, color: '#ef4444' }}>{days} gün gecikmiş</div>
                    </div>
                    {assignee && <UserAvatar user={assignee} size={24} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
