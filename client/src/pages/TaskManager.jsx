import React, { useState, useEffect } from 'react';
import { Plus, Check, Clock, Trash2, Search, Filter, AlertTriangle, CheckSquare, Award, ArrowRight } from 'lucide-react';
import { t } from '../i18n';
import { useLang } from '../App';

export default function TaskManager() {
  const { lang } = useLang();
  
  // Task State
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('aatools-tasks');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'SQL Raporlarını Hazırla', desc: 'sqlite3 veritabanından aylık hat performans raporlarını çek.', priority: 'high', status: 'progress', category: 'Rapor' },
      { id: '2', title: 'PDF Dokümanlarını Birleştir', desc: 'İmzalı hat listesi PDF dosyalarını tek belgede birleştir.', priority: 'medium', status: 'pending', category: 'Belge' },
      { id: '3', title: 'Telefon Listesini Temizle', desc: 'Bozuk telefon verilerini veri temizleyici ile düzenle.', priority: 'low', status: 'completed', category: 'Veri' },
    ];
  });

  // Task Form State
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('İş');

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Persist Tasks
  useEffect(() => {
    localStorage.setItem('aatools-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Form Submission
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      desc: desc.trim(),
      priority,
      status: 'pending',
      category: category.trim() || 'Genel'
    };

    setTasks(prev => [newTask, ...prev]);
    setTitle('');
    setDesc('');
    setPriority('medium');
    setCategory('İş');
  };

  // Change Task Status
  const changeStatus = (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  // Delete Task
  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Calculate Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const activeTasks = totalTasks - completedTasks;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const highPriorityCount = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          task.desc.toLowerCase().includes(search.toLowerCase()) ||
                          task.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Priorities colors/glow helper
  const getPriorityStyle = (prio) => {
    switch(prio) {
      case 'high':
        return {
          border: '1px solid rgba(255, 107, 107, 0.25)',
          boxShadow: '0 0 12px rgba(255, 107, 107, 0.05)',
          badgeColor: 'badge-red',
          badgeText: 'Acil'
        };
      case 'medium':
        return {
          border: '1px solid rgba(245, 166, 35, 0.25)',
          boxShadow: '0 0 12px rgba(245, 166, 35, 0.05)',
          badgeColor: 'badge-orange',
          badgeText: 'Normal'
        };
      default:
        return {
          border: '1px solid rgba(0, 212, 170, 0.25)',
          boxShadow: '0 0 12px rgba(0, 212, 170, 0.05)',
          badgeColor: 'badge-green',
          badgeText: 'Düşük'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
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
          📝
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Bento Görev Yöneticisi
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Günlük ofis işlerinizi planlayın, önceliklendirin ve tamamlama oranınızı bento metrikleriyle izleyin.
          </p>
        </div>
      </div>

      {/* Bento Progress & Metrics Grid */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        
        {/* Metric 1: Progress Radial/Bar */}
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="kpi-card-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={14} style={{ color: 'var(--accent2)' }} /> İlerleme Oranı
            </span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent2)' }}>%{progressPercent}</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-base)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${progressPercent}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--accent), var(--accent2))', 
              transition: 'width 0.4s ease' 
            }} />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Tamamlanan: {completedTasks} / {totalTasks} görev
          </div>
        </div>

        {/* Metric 2: Active Tasks */}
        <div className="kpi-card" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div className="kpi-card-icon" style={{ margin: 0, background: 'rgba(79, 124, 255, 0.15)', color: 'var(--accent)' }}>
            <Clock size={20} />
          </div>
          <div>
            <div className="kpi-card-value">{activeTasks}</div>
            <div className="kpi-card-label">Aktif Görevler</div>
          </div>
        </div>

        {/* Metric 3: High Priority Urgent */}
        <div className="kpi-card" style={{ display: 'flex', gap: '14px', alignItems: 'center', '--kpi-accent': 'var(--accent3)' }}>
          <div className="kpi-card-icon" style={{ margin: 0, background: 'rgba(255, 107, 107, 0.15)', color: 'var(--accent3)' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="kpi-card-value" style={{ color: 'var(--accent3)' }}>{highPriorityCount}</div>
            <div className="kpi-card-label">Acil Yapılacak</div>
          </div>
        </div>

        {/* Metric 4: Completed Tasks */}
        <div className="kpi-card" style={{ display: 'flex', gap: '14px', alignItems: 'center', '--kpi-accent': 'var(--accent2)' }}>
          <div className="kpi-card-icon" style={{ margin: 0, background: 'rgba(0, 212, 170, 0.15)', color: 'var(--accent2)' }}>
            <CheckSquare size={20} />
          </div>
          <div>
            <div className="kpi-card-value" style={{ color: 'var(--accent2)' }}>{completedTasks}</div>
            <div className="kpi-card-label">Biten Görevler</div>
          </div>
        </div>

      </div>

      {/* Main Panel Layout: Input Form & Tasks List */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Bento: Quick Add Task Form */}
        <form onSubmit={handleAddTask} className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '13px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Yeni Görev Ekle</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Görev Başlığı</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="select-filter"
              placeholder="Ör. Raporu tamamla..."
              style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Açıklama</label>
            <textarea 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{
                width: '100%', height: '70px', background: 'var(--bg-base)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', padding: '8px 10px', fontSize: '13px',
                outline: 'none', resize: 'none'
              }}
              placeholder="Görev detayları..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Öncelik</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="select-filter"
                style={{ width: '100%', height: '36px' }}
              >
                <option value="low">Düşük</option>
                <option value="medium">Normal</option>
                <option value="high">Acil</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Kategori</label>
              <input 
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-filter"
                placeholder="Ör. Rapor"
                style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Görev Ekle
          </button>
        </form>

        {/* Right Bento: Tasks Board */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Filter Bar Card */}
          <div className="chart-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '14px 20px' }}>
            
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '0 10px' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Görevlerde veya kategorilerde ara..."
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', height: '34px', fontSize: '13px', width: '100%', outline: 'none' }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select-filter"
                style={{ height: '34px', width: '120px', fontSize: '12px' }}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="pending">Bekliyor</option>
                <option value="progress">Yapılıyor</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select 
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="select-filter"
                style={{ height: '34px', width: '120px', fontSize: '12px' }}
              >
                <option value="all">Tüm Öncelikler</option>
                <option value="low">Düşük</option>
                <option value="medium">Normal</option>
                <option value="high">Acil</option>
              </select>
            </div>

          </div>

          {/* Grid Tasks List */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filteredTasks.length === 0 ? (
              <div className="chart-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                Aradığınız kriterlere uygun görev bulunamadı.
              </div>
            ) : (
              filteredTasks.map(task => {
                const styleMeta = getPriorityStyle(task.priority);
                return (
                  <div 
                    key={task.id} 
                    className="chart-card" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px', 
                      position: 'relative', 
                      opacity: task.status === 'completed' ? 0.65 : 1,
                      border: styleMeta.border,
                      boxShadow: styleMeta.boxShadow
                    }}
                  >
                    {/* Top Row: Category tag and Priority Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        color: 'var(--text-accent)', 
                        background: 'var(--accent-glow)', 
                        padding: '2px 8px', 
                        borderRadius: 'var(--radius-sm)', 
                        fontWeight: 600 
                      }}>
                        {task.category}
                      </span>
                      <span className={`badge ${styleMeta.badgeColor}`}>
                        {styleMeta.badgeText}
                      </span>
                    </div>

                    {/* Task Title & Details */}
                    <div>
                      <h4 style={{ 
                        fontSize: '14px', 
                        fontWeight: 700, 
                        color: 'var(--text-primary)', 
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none' 
                      }}>
                        {task.title}
                      </h4>
                      <p style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-secondary)', 
                        marginTop: '4px',
                        lineHeight: 1.4,
                        minHeight: '34px'
                      }}>
                        {task.desc}
                      </p>
                    </div>

                    {/* Actions and Status Switches */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      {/* Status selectors */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {task.status !== 'pending' && (
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                            onClick={() => changeStatus(task.id, 'pending')}
                            title="Bekliyor durumuna getir"
                          >
                            Beklet
                          </button>
                        )}
                        {task.status !== 'progress' && task.status !== 'completed' && (
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '2px 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '2px' }}
                            onClick={() => changeStatus(task.id, 'progress')}
                          >
                            Başlat <ArrowRight size={10} />
                          </button>
                        )}
                        {task.status !== 'completed' && (
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '2px 6px', fontSize: '10px', color: 'var(--accent2)', background: 'rgba(0, 212, 170, 0.05)' }}
                            onClick={() => changeStatus(task.id, 'completed')}
                          >
                            ✓ Tamamla
                          </button>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => deleteTask(task.id)}
                        style={{ padding: '4px', color: 'var(--danger)' }}
                        title="Görevi Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
