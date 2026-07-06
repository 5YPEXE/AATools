/**
 * StokTakip.jsx — Kapsamlı Stok Yönetim Sistemi
 * Tasarım: AATools tasarım sistemiyle tam uyumlu
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Package, Plus, Edit3, Trash2, X, Check, Search,
  FileSpreadsheet, AlertTriangle, ArrowLeftRight,
  ArrowDownCircle, ArrowUpCircle, Tag, BarChart3,
  TrendingDown, Eye, Hash, Layers, CheckCircle2, Settings,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import {
  useStok, DURUMLAR, HAREKET_TIPLERI, BIRIMLER,
} from '../context/StokContext';

// ─────────────────────────────────────────────────────────────────
// Tiny shared components
// ─────────────────────────────────────────────────────────────────
function Badge({ color, children }) {
  const map = {
    green:  { bg: 'rgba(16,185,129,.12)',  fg: '#10b981', border: 'rgba(16,185,129,.25)' },
    blue:   { bg: 'rgba(37,99,235,.10)',   fg: '#2563eb', border: 'rgba(37,99,235,.2)'   },
    orange: { bg: 'rgba(249,115,22,.12)',  fg: '#f97316', border: 'rgba(249,115,22,.25)' },
    red:    { bg: 'rgba(239,68,68,.10)',   fg: '#ef4444', border: 'rgba(239,68,68,.2)'   },
    purple: { bg: 'rgba(124,58,237,.10)',  fg: '#7c3aed', border: 'rgba(124,58,237,.2)'  },
    gray:   { bg: 'rgba(107,114,128,.10)', fg: '#6b7280', border: 'rgba(107,114,128,.2)' },
  };
  const s = map[color] || map.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.fg, border: `1px solid ${s.border}`,
    }}>
      {children}
    </span>
  );
}

const DURUM_COLOR = { depoda: 'green', dagitildi: 'blue', serviste: 'orange', hurda: 'red' };

function DurumBadge({ durum }) {
  const d = DURUMLAR.find(x => x.id === durum) || { label: durum, ikon: '?' };
  return <Badge color={DURUM_COLOR[durum] || 'gray'}>{d.ikon} {d.label}</Badge>;
}

function KategoriChip({ kat }) {
  if (!kat) return <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>—</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: kat.renk + '18', color: kat.renk,
    }}>
      {kat.ikon} {kat.ad}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// Field helper for modals
// ─────────────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div className="form-row">
      <label className="form-label">
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 2 }}>{error}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Ürün Modalı
// ─────────────────────────────────────────────────────────────────
function UrunModal({ urun, kategoriler, onSave, onClose }) {
  const [form, setForm] = useState(urun ? { ...urun } : {
    tip: 'seri', kategoriId: kategoriler[0]?.id || '',
    ad: '', marka: '', model: '', seriNo: '', terminalNo: '',
    posNo: '', versiyon: '', durum: 'depoda', konum: '',
    miktar: 1, minMiktar: '', birim: 'adet', notlar: '',
    val8SeriNo: '', dcp4SeriNo: '',
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const secilenKat = kategoriler.find(k => k.id === form.kategoriId);
  const isValidator = secilenKat?.id === 'kat-validator';

  const validate = () => {
    const e = {};
    if (!form.ad?.trim()) e.ad = 'Ad zorunlu';
    if (!form.kategoriId) e.kategoriId = 'Kategori seçin';
    if (form.tip === 'seri' && !form.seriNo?.trim()) e.seriNo = 'Seri numarası zorunlu';
    if (form.tip === 'adet' && (form.miktar == null || form.miktar < 0)) e.miktar = 'Geçerli miktar girin';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: 580 }}>

        {/* Header */}
        <div className="modal-card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 18,
              background: 'var(--accent-glow)', border: '1px solid rgba(var(--accent-rgb),.15)',
            }}>📦</div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>
                {urun ? 'Ürün Düzenle' : 'Yeni Ürün / Cihaz'}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)' }}>
                Stok bilgilerini doldurun
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-form">

          {/* Takip tipi seçimi */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Takip Tipi
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: 'seri',  emoji: '🔢', title: 'Seri Numaralı', desc: 'Her cihaz ayrı takip' },
                { id: 'adet', emoji: '📦', title: 'Adet Bazlı',    desc: 'Kart, vida, kablo...' },
              ].map(t => (
                <button key={t.id} onClick={() => set('tip', t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10, border: '2px solid',
                  borderColor: form.tip === t.id ? 'var(--accent)' : 'var(--border)',
                  background: form.tip === t.id ? 'var(--accent-glow)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                }}>
                  <span style={{ fontSize: 20 }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: form.tip === t.id ? 'var(--accent)' : 'var(--text-primary)' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Kategori */}
          <Field label="Kategori" required error={errors.kategoriId}>
            <select value={form.kategoriId} onChange={e => set('kategoriId', e.target.value)}
              className="form-input" style={errors.kategoriId ? { borderColor: '#ef4444' } : {}}>
              <option value="">— Seçin —</option>
              {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ikon} {k.ad}</option>)}
            </select>
          </Field>

          <Field label="Ürün / Cihaz Adı" required error={errors.ad}>
            <input value={form.ad} onChange={e => set('ad', e.target.value)}
              placeholder="Örn: VAL8 Validatör, Vida M6, Entrust HSM"
              className="form-input" style={errors.ad ? { borderColor: '#ef4444' } : {}} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Marka">
              <input value={form.marka || ''} onChange={e => set('marka', e.target.value)}
                placeholder="Telpo, Entrust..." className="form-input" />
            </Field>
            <Field label="Model">
              <input value={form.model || ''} onChange={e => set('model', e.target.value)}
                placeholder="VAL8-Pro, K7..." className="form-input" />
            </Field>
          </div>

          {/* Seri numaralı alanlar */}
          {form.tip === 'seri' && (
            <div style={{ background: 'var(--bg-hover)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                🔢 Seri & Kimlik Bilgileri
              </p>
              <Field label="Seri Numarası" required error={errors.seriNo}>
                <input value={form.seriNo || ''} onChange={e => set('seriNo', e.target.value)}
                  placeholder="Cihaz seri numarası" className="form-input"
                  style={{ fontFamily: 'JetBrains Mono, monospace', ...(errors.seriNo ? { borderColor: '#ef4444' } : {}) }} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Terminal / Köşe No">
                  <input value={form.terminalNo || ''} onChange={e => set('terminalNo', e.target.value)}
                    placeholder="245" className="form-input" style={{ fontFamily: 'JetBrains Mono, monospace' }} />
                </Field>
                <Field label="POS Numarası">
                  <input value={form.posNo || ''} onChange={e => set('posNo', e.target.value)}
                    placeholder="POS-001" className="form-input" style={{ fontFamily: 'JetBrains Mono, monospace' }} />
                </Field>
              </div>
              <Field label="Versiyon">
                <input value={form.versiyon || ''} onChange={e => set('versiyon', e.target.value)}
                  placeholder="Yazılım / donanım versiyonu" className="form-input" />
              </Field>

              {isValidator && (
                <div style={{ background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.2)', borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                    📟 Validatör Birimleri
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="VAL8 Seri No">
                      <input value={form.val8SeriNo || ''} onChange={e => set('val8SeriNo', e.target.value)}
                        placeholder="VAL8 seri no" className="form-input" style={{ fontFamily: 'JetBrains Mono, monospace' }} />
                    </Field>
                    <Field label="DCP4 Seri No">
                      <input value={form.dcp4SeriNo || ''} onChange={e => set('dcp4SeriNo', e.target.value)}
                        placeholder="DCP4 seri no" className="form-input" style={{ fontFamily: 'JetBrains Mono, monospace' }} />
                    </Field>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Durum">
                  <select value={form.durum || 'depoda'} onChange={e => set('durum', e.target.value)} className="form-input">
                    {DURUMLAR.map(d => <option key={d.id} value={d.id}>{d.ikon} {d.label}</option>)}
                  </select>
                </Field>
                <Field label="Konum / Araç No">
                  <input value={form.konum || ''} onChange={e => set('konum', e.target.value)}
                    placeholder="Araçta ise araç no..." className="form-input" />
                </Field>
              </div>
            </div>
          )}

          {/* Adet bazlı alanlar */}
          {form.tip === 'adet' && (
            <div style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                📦 Stok Bilgileri
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Mevcut Miktar" required error={errors.miktar}>
                  <input type="number" min="0" value={form.miktar ?? 1} onChange={e => set('miktar', +e.target.value)}
                    className="form-input" style={errors.miktar ? { borderColor: '#ef4444' } : {}} />
                </Field>
                <Field label="Min. Stok Uyarısı">
                  <input type="number" min="0" value={form.minMiktar || ''} onChange={e => set('minMiktar', +e.target.value)}
                    placeholder="10" className="form-input" />
                </Field>
                <Field label="Birim">
                  <select value={form.birim || 'adet'} onChange={e => set('birim', e.target.value)} className="form-input">
                    {BIRIMLER.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}

          <Field label="Notlar">
            <textarea value={form.notlar || ''} onChange={e => set('notlar', e.target.value)}
              placeholder="Ek notlar, özellikler..." className="form-input" rows={2}
              style={{ resize: 'vertical' }} />
          </Field>
        </div>

        <div className="modal-form-actions" style={{ padding: '0 24px 20px', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button className="btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn-primary" onClick={handleSave}><Check size={14} /> Kaydet</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Hareket Modalı
// ─────────────────────────────────────────────────────────────────
function HareketModal({ urun, onSave, onClose, users }) {
  const [form, setForm] = useState({
    tip: 'cikis',
    tarih: new Date().toISOString().split('T')[0],
    miktar: 1, aracNo: '', teslimEden: '', teslimAlan: '', aciklama: '',
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const e = {};
    if (!form.tarih) e.tarih = 'Tarih zorunlu';
    if (urun?.tip === 'adet' && (!form.miktar || form.miktar <= 0)) e.miktar = 'Miktar girin';
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...form, urunId: urun.id });
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <div className="modal-card" style={{ maxWidth: 460 }}>
        <div className="modal-card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
          <div>
            <h3 style={{ margin: '0 0 2px' }}>Stok Hareketi</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>
              {urun?.ad}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="modal-form">
          {/* Hareket tipi butonları */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Hareket Tipi
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {HAREKET_TIPLERI.map(h => (
                <button key={h.id} onClick={() => set('tip', h.id)} style={{
                  padding: '9px 6px', borderRadius: 9, border: '2px solid',
                  borderColor: form.tip === h.id ? h.renk : 'var(--border)',
                  background: form.tip === h.id ? h.renk + '18' : 'transparent',
                  color: form.tip === h.id ? h.renk : 'var(--text-tertiary)',
                  cursor: 'pointer', fontSize: 11, fontWeight: 700, textAlign: 'center',
                  transition: 'all .15s',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 2 }}>{h.ikon}</div>
                  {h.label.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          <Field label="Tarih" required error={errors.tarih}>
            <input type="date" value={form.tarih} onChange={e => set('tarih', e.target.value)}
              className="form-input" style={errors.tarih ? { borderColor: '#ef4444' } : {}} />
          </Field>

          {urun?.tip === 'adet' && (
            <Field label={`Miktar (${urun.birim || 'adet'})`} required error={errors.miktar}>
              <input type="number" min="1" value={form.miktar} onChange={e => set('miktar', +e.target.value)}
                className="form-input" style={errors.miktar ? { borderColor: '#ef4444' } : {}} />
            </Field>
          )}

          {['cikis', 'iade'].includes(form.tip) && (
            <Field label="Araç / Lokasyon">
              <input value={form.aracNo} onChange={e => set('aracNo', e.target.value)}
                placeholder="Araç plakası veya lokasyon" className="form-input" />
            </Field>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Teslim Eden">
              <select value={form.teslimEden} onChange={e => set('teslimEden', e.target.value)} className="form-input">
                <option value="">— Seçin —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="Teslim Alan">
              <select value={form.teslimAlan} onChange={e => set('teslimAlan', e.target.value)} className="form-input">
                <option value="">— Seçin —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Açıklama">
            <textarea value={form.aciklama} onChange={e => set('aciklama', e.target.value)}
              placeholder="İşlem notu..." className="form-input" rows={2} style={{ resize: 'vertical' }} />
          </Field>
        </div>

        <div className="modal-form-actions" style={{ padding: '0 24px 20px', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button className="btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn-primary" onClick={handleSave}><Check size={14} /> Kaydet</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Kategori Modalı
// ─────────────────────────────────────────────────────────────────
function KategoriModal({ kat, onSave, onClose }) {
  const [form, setForm] = useState(kat || { ad: '', ikon: '📦', renk: '#6366f1', aciklama: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const ikonlar = ['📟','🖥️','💳','🔒','📷','🔧','📦','🛠️','⚙️','📱','🖨️','🔌','💡','🎥','🔑','📡','🖱️','⌨️'];
  const renkler = ['#6366f1','#2563eb','#10b981','#ef4444','#f97316','#8b5cf6','#06b6d4','#f59e0b','#ec4899','#6b7280'];

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: 400 }}>
        <div className="modal-card-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 14 }}>
          <h3 style={{ margin: 0 }}>{kat ? 'Kategori Düzenle' : 'Yeni Kategori'}</h3>
          <button className="modal-close-btn" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="modal-form">
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>İkon</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ikonlar.map(i => (
                <button key={i} onClick={() => set('ikon', i)} className="icon-opt" style={form.ikon === i ? { background: 'var(--accent-glow)', borderColor: 'var(--accent)' } : {}}>{i}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Renk</p>
            <div className="color-picker">
              {renkler.map(r => (
                <button key={r} onClick={() => set('renk', r)} className="color-dot" style={{ background: r, borderColor: form.renk === r ? 'white' : 'transparent', transform: form.renk === r ? 'scale(1.25)' : undefined, boxShadow: form.renk === r ? `0 0 0 2px ${r}` : 'none' }} />
              ))}
            </div>
          </div>
          <Field label="Kategori Adı" required>
            <input value={form.ad} onChange={e => set('ad', e.target.value)} placeholder="Örn: Ağ Ekipmanları" className="form-input" />
          </Field>
          <Field label="Açıklama">
            <input value={form.aciklama} onChange={e => set('aciklama', e.target.value)} placeholder="Kısa açıklama" className="form-input" />
          </Field>
        </div>
        <div className="modal-form-actions" style={{ padding: '0 24px 20px', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button className="btn-ghost" onClick={onClose}>İptal</button>
          <button className="btn-primary" onClick={() => form.ad.trim() && onSave(form)}><Check size={13} /> Kaydet</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Confirm Dialog
// ─────────────────────────────────────────────────────────────────
function ConfirmDialog({ title, desc, onConfirm, onCancel, danger = true }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div className="modal-card" style={{ maxWidth: 340, padding: 28, textAlign: 'center' }}>
        <AlertTriangle size={38} style={{ color: '#ef4444', marginBottom: 12 }} />
        <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>{desc}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-ghost" onClick={onCancel}>İptal</button>
          <button className="btn-primary" onClick={onConfirm}
            style={danger ? { background: '#ef4444', borderColor: '#ef4444' } : {}}
          >Sil</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Özet Tab
// ─────────────────────────────────────────────────────────────────
function TabOzet({ setActiveTab }) {
  const { getOzet, hareketler, urunler } = useStok();
  const ozet = useMemo(() => getOzet(), [getOzet, urunler]);

  const sonHareketler = useMemo(() =>
    [...hareketler].sort((a, b) => new Date(b.kayitTarihi) - new Date(a.kayitTarihi)).slice(0, 7),
  [hareketler]);

  const getUrunAd = id => urunler.find(u => u.id === id)?.ad || '—';

  const stats = [
    { icon: <Hash size={16} />, label: 'Seri Cihaz',  value: ozet.toplamSeri,  color: 'var(--accent)',  onClick: () => setActiveTab('liste') },
    { icon: <Layers size={16}/>, label: 'Stok Kalemi', value: ozet.toplamAdet, color: '#06b6d4',        onClick: () => setActiveTab('liste') },
    { icon: <CheckCircle2 size={16}/>, label: 'Depoda',value: ozet.depoda,     color: '#10b981' },
    { icon: <ArrowUpCircle size={16}/>, label: 'Dağıtıldı', value: ozet.dagitildi, color: '#7c3aed' },
    { icon: <Settings size={16}/>, label: 'Serviste',  value: ozet.serviste,   color: '#f97316' },
    { icon: <TrendingDown size={16}/>, label: 'Kritik Stok', value: ozet.kritikStok, color: '#ef4444', onClick: () => setActiveTab('liste') },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" onClick={s.onClick}
            style={{ cursor: s.onClick ? 'pointer' : 'default', borderLeft: `3px solid ${s.color}`, flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: '14px 16px' }}
            onMouseEnter={e => s.onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '')}>
            <div style={{ color: s.color, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700 }}>
              {s.icon} {s.label}
            </div>
            <div className="stat-value">{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Son hareketler */}
        <div className="chart-card">
          <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <ArrowLeftRight size={15} style={{ color: 'var(--accent)' }} /> Son Hareketler
          </h3>
          {sonHareketler.length === 0
            ? <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: '20px 0' }}>Henüz hareket yok</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {sonHareketler.map(h => {
                  const ht = HAREKET_TIPLERI.find(x => x.id === h.tip) || { label: h.tip, renk: '#888', ikon: '?' };
                  return (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                      <span style={{ fontSize: 16 }}>{ht.ikon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getUrunAd(h.urunId)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{h.aracNo || h.aciklama || ht.label}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: ht.renk, background: ht.renk + '18', padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>
                        {ht.label.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
          }
        </div>

        {/* Kategori dağılımı */}
        <div className="chart-card">
          <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Tag size={15} style={{ color: '#10b981' }} /> Kategori Dağılımı
          </h3>
          {ozet.kategoriDagilim.filter(k => k.count > 0).length === 0
            ? <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: '20px 0' }}>Henüz kayıt yok</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...ozet.kategoriDagilim].sort((a, b) => b.count - a.count).map(k => {
                  const total = ozet.toplamSeri + ozet.toplamAdet || 1;
                  return (
                    <div key={k.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{k.ikon} {k.ad}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: k.renk }}>{k.count}</span>
                      </div>
                      <div className="workload-bar-bg">
                        <div className="workload-bar-fill" style={{ width: `${Math.round(k.count / total * 100)}%`, background: k.renk }} />
                      </div>
                    </div>
                  );
                })}
              </div>
          }

          {ozet.kritikUrunler?.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={13} /> Kritik Stok Uyarıları
              </div>
              {ozet.kritikUrunler.slice(0, 4).map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{u.ad}</span>
                  <span style={{ color: '#ef4444', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>{u.miktar}/{u.minMiktar} {u.birim}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Stok Listesi Tab
// ─────────────────────────────────────────────────────────────────
function TabListe({ readonly }) {
  const { urunler, kategoriler, addUrun, updateUrun, deleteUrun, addHareket } = useStok();
  const { currentUser, getAllUsers } = useAuth();
  const allUsers = useMemo(() => getAllUsers(), []);

  const [search, setSearch]     = useState('');
  const [filterKat, setFilterKat] = useState('');
  const [filterDurum, setFilterDurum] = useState('');
  const [filterTip, setFilterTip] = useState('');
  const [modal, setModal]       = useState(null);
  const [hareketModal, setHareketModal] = useState(null);
  const [confirm, setConfirm]   = useState(null);

  const getKat = id => kategoriler.find(k => k.id === id);

  const filtered = useMemo(() => {
    let list = [...urunler];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => [u.ad, u.seriNo, u.terminalNo, u.posNo, u.model, u.marka].some(v => v?.toLowerCase().includes(q)));
    }
    if (filterKat)   list = list.filter(u => u.kategoriId === filterKat);
    if (filterDurum) list = list.filter(u => u.durum === filterDurum);
    if (filterTip)   list = list.filter(u => u.tip === filterTip);
    return list.sort((a, b) => new Date(b.kayitTarihi) - new Date(a.kayitTarihi));
  }, [urunler, search, filterKat, filterDurum, filterTip]);

  const exportExcel = () => {
    const rows = filtered.map(u => {
      const kat = getKat(u.kategoriId);
      return {
        'Kategori': kat?.ad || '', 'Takip Tipi': u.tip === 'seri' ? 'Seri Numaralı' : 'Adet Bazlı',
        'Ürün / Cihaz Adı': u.ad || '', 'Marka': u.marka || '', 'Model': u.model || '',
        'Seri No': u.seriNo || '', 'Terminal / Köşe No': u.terminalNo || '', 'POS No': u.posNo || '',
        'VAL8 Seri No': u.val8SeriNo || '', 'DCP4 Seri No': u.dcp4SeriNo || '',
        'Versiyon': u.versiyon || '', 'Durum': DURUMLAR.find(d => d.id === u.durum)?.label || '',
        'Miktar': u.tip === 'adet' ? u.miktar : '', 'Birim': u.birim || '', 'Min. Stok': u.minMiktar || '',
        'Konum': u.konum || '', 'Notlar': u.notlar || '',
        'Kayıt Tarihi': u.kayitTarihi ? new Date(u.kayitTarihi).toLocaleDateString('tr-TR') : '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stok');
    XLSX.writeFile(wb, `stok_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const isKritik = u => u.tip === 'adet' && u.minMiktar && u.miktar <= u.minMiktar;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
          <Search size={14} className="search-icon" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ad, seri no, marka, model ara…" className="search-input" style={{ width: '100%' }} />
        </div>
        <select value={filterKat} onChange={e => setFilterKat(e.target.value)} className="filter-select">
          <option value="">Tüm kategoriler</option>
          {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ikon} {k.ad}</option>)}
        </select>
        <select value={filterTip} onChange={e => setFilterTip(e.target.value)} className="filter-select">
          <option value="">Seri + Adet</option>
          <option value="seri">Seri Numaralı</option>
          <option value="adet">Adet Bazlı</option>
        </select>
        <select value={filterDurum} onChange={e => setFilterDurum(e.target.value)} className="filter-select">
          <option value="">Tüm durumlar</option>
          {DURUMLAR.map(d => <option key={d.id} value={d.id}>{d.ikon} {d.label}</option>)}
        </select>
        <button onClick={exportExcel} className="btn-ghost" style={{ gap: 6 }}>
          <FileSpreadsheet size={14} /> Excel
        </button>
        {!readonly && (
          <button onClick={() => setModal('add')} className="btn-primary">
            <Plus size={14} /> Ekle
          </button>
        )}
      </div>

      {/* Tablo */}
      <div className="task-list-table-wrap">
        <table className="task-list-table">
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Ürün / Cihaz</th>
              <th>Kimlik Bilgileri</th>
              <th>Durum / Miktar</th>
              <th>Konum</th>
              {!readonly && <th style={{ width: 90 }}>İşlemler</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={readonly ? 5 : 6}>
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <Package size={36} style={{ marginBottom: 10, color: 'var(--text-tertiary)' }} />
                    <p style={{ fontWeight: 700, margin: '0 0 4px' }}>
                      {urunler.length === 0 ? 'Stok kaydı yok' : 'Sonuç bulunamadı'}
                    </p>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>
                      {urunler.length === 0 && !readonly ? '"Ekle" butonu ile ilk kaydı oluşturun.' : 'Filtrelerinizi değiştirin.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map(u => {
              const kat = getKat(u.kategoriId);
              const kritik = isKritik(u);
              return (
                <tr key={u.id} className="task-list-row" style={kritik ? { background: 'rgba(239,68,68,.04)' } : {}}>
                  <td><KategoriChip kat={kat} /></td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{u.ad}</div>
                    {(u.marka || u.model) && (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                        {[u.marka, u.model].filter(Boolean).join(' · ')}
                        {u.versiyon && ` · v${u.versiyon}`}
                      </div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                    {u.tip === 'seri' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {u.seriNo    && <span><span style={{ color: 'var(--text-tertiary)' }}>S/N  </span>{u.seriNo}</span>}
                        {u.terminalNo && <span><span style={{ color: 'var(--text-tertiary)' }}>TRM  </span>{u.terminalNo}</span>}
                        {u.posNo     && <span><span style={{ color: 'var(--text-tertiary)' }}>POS  </span>{u.posNo}</span>}
                        {u.val8SeriNo && <span><span style={{ color: '#7c3aed' }}>VAL8 </span>{u.val8SeriNo}</span>}
                        {u.dcp4SeriNo && <span><span style={{ color: '#7c3aed' }}>DCP4 </span>{u.dcp4SeriNo}</span>}
                        {!u.seriNo && !u.terminalNo && !u.posNo && <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: kritik ? '#ef4444' : 'var(--text-primary)' }}>{u.miktar}</span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 12, fontFamily: 'inherit' }}>{u.birim || 'adet'}</span>
                        {kritik && <AlertTriangle size={14} style={{ color: '#ef4444' }} />}
                      </div>
                    )}
                  </td>
                  <td>
                    {u.tip === 'seri'
                      ? <DurumBadge durum={u.durum} />
                      : <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {u.minMiktar ? `Min: ${u.minMiktar} ${u.birim || 'adet'}` : 'Adet takibi'}
                        </span>
                    }
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.konum || '—'}</td>
                  {!readonly && (
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setHareketModal(u)} className="btn-ghost-sm" title="Hareket Ekle" style={{ color: 'var(--accent)' }}>
                          <ArrowLeftRight size={12} />
                        </button>
                        <button onClick={() => setModal(u)} className="btn-ghost-sm" title="Düzenle">
                          <Edit3 size={12} />
                        </button>
                        <button onClick={() => setConfirm(u)} className="btn-ghost-sm" title="Sil" style={{ color: '#ef4444' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
        {filtered.length} kayıt · toplam {urunler.length}
      </p>

      {modal && (
        <UrunModal
          urun={modal === 'add' ? null : modal}
          kategoriler={kategoriler}
          onSave={form => { modal === 'add' ? addUrun(form, currentUser?.id) : updateUrun(modal.id, form); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {hareketModal && (
        <HareketModal
          urun={hareketModal}
          users={allUsers}
          onSave={form => { addHareket(form, currentUser?.id); setHareketModal(null); }}
          onClose={() => setHareketModal(null)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title="Kaydı sil?"
          desc={<><strong>{confirm.ad}</strong> kalıcı olarak silinecek.</>}
          onConfirm={() => { deleteUrun(confirm.id); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Hareketler Tab
// ─────────────────────────────────────────────────────────────────
function TabHareketler() {
  const { hareketler, urunler } = useStok();
  const { getAllUsers } = useAuth();
  const allUsers = useMemo(() => getAllUsers(), []);
  const [search, setSearch]   = useState('');
  const [filterTip, setFilterTip] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]   = useState('');

  const getUrun     = id => urunler.find(u => u.id === id);
  const getUserName = id => allUsers.find(u => u.id === id)?.name || (id || '—');

  const filtered = useMemo(() => {
    let list = [...hareketler];
    if (filterTip) list = list.filter(h => h.tip === filterTip);
    if (dateFrom)  list = list.filter(h => h.tarih >= dateFrom);
    if (dateTo)    list = list.filter(h => h.tarih <= dateTo);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(h => {
        const u = getUrun(h.urunId);
        return u?.ad?.toLowerCase().includes(q) || h.aracNo?.toLowerCase().includes(q) || h.aciklama?.toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => new Date(b.kayitTarihi) - new Date(a.kayitTarihi));
  }, [hareketler, filterTip, dateFrom, dateTo, search]);

  const exportExcel = () => {
    const rows = filtered.map(h => {
      const u = getUrun(h.urunId);
      const ht = HAREKET_TIPLERI.find(x => x.id === h.tip);
      return {
        'Tarih': h.tarih || '', 'Hareket': ht?.label || h.tip,
        'Ürün / Cihaz': u?.ad || '', 'Seri No': u?.seriNo || '',
        'Miktar': h.miktar || '', 'Araç / Lokasyon': h.aracNo || '',
        'Teslim Eden': getUserName(h.teslimEden), 'Teslim Alan': getUserName(h.teslimAlan),
        'Açıklama': h.aciklama || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hareketler');
    XLSX.writeFile(wb, `stok_hareketler_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={14} className="search-icon" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ürün, araç, açıklama ara…" className="search-input" style={{ width: '100%' }} />
        </div>
        <select value={filterTip} onChange={e => setFilterTip(e.target.value)} className="filter-select">
          <option value="">Tüm hareketler</option>
          {HAREKET_TIPLERI.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="filter-select" title="Başlangıç tarihi" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="filter-select" title="Bitiş tarihi" />
        <button onClick={exportExcel} className="btn-ghost" style={{ gap: 6 }}>
          <FileSpreadsheet size={14} /> Excel
        </button>
      </div>

      <div className="task-list-table-wrap">
        <table className="task-list-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Hareket</th>
              <th>Ürün / Cihaz</th>
              <th>Miktar</th>
              <th>Araç / Lokasyon</th>
              <th>Teslim Eden</th>
              <th>Teslim Alan</th>
              <th>Açıklama</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)' }}>Kayıt bulunamadı</td></tr>
            )}
            {filtered.map(h => {
              const u = getUrun(h.urunId);
              const ht = HAREKET_TIPLERI.find(x => x.id === h.tip) || { label: h.tip, renk: '#888', ikon: '?' };
              return (
                <tr key={h.id} className="task-list-row">
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600 }}>
                    {h.tarih ? new Date(h.tarih + 'T00:00:00').toLocaleDateString('tr-TR') : '—'}
                  </td>
                  <td>
                    <Badge color={ht.id === 'giris' || ht.id === 'iade' ? 'green' : ht.id === 'hurda' ? 'red' : ht.id === 'sayim' ? 'purple' : 'blue'}>
                      {ht.ikon} {ht.label.split(' ')[0]}
                    </Badge>
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{u?.ad || '—'}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{h.miktar || '—'}</td>
                  <td style={{ fontSize: 12 }}>{h.aracNo || '—'}</td>
                  <td style={{ fontSize: 12 }}>{getUserName(h.teslimEden)}</td>
                  <td style={{ fontSize: 12 }}>{getUserName(h.teslimAlan)}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.aciklama || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>{filtered.length} hareket kayıtı</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Kategoriler Tab
// ─────────────────────────────────────────────────────────────────
function TabKategoriler({ readonly }) {
  const { kategoriler, addKategori, updateKategori, deleteKategori, urunler } = useStok();
  const [modal, setModal]   = useState(null);
  const [confirm, setConfirm] = useState(null);

  const getCount = katId => urunler.filter(u => u.kategoriId === katId).length;

  return (
    <div>
      {!readonly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={() => setModal('add')} className="btn-primary"><Plus size={14} /> Kategori Ekle</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {kategoriler.map(k => {
          const count = getCount(k.id);
          return (
            <div key={k.id} className="chart-card" style={{ borderLeft: `4px solid ${k.renk}`, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: k.renk + '18', border: `1px solid ${k.renk}30`,
                  }}>{k.ikon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{k.ad}</div>
                    {k.aciklama && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{k.aciklama}</div>}
                  </div>
                </div>
                {!readonly && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => setModal(k)} className="btn-ghost-sm" title="Düzenle"><Edit3 size={12} /></button>
                    <button onClick={() => setConfirm(k)} className="btn-ghost-sm" title="Sil" style={{ color: '#ef4444' }}><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: k.renk }}>{count}</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>kayıt</span>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <KategoriModal
          kat={modal === 'add' ? null : modal}
          onSave={form => { modal === 'add' ? addKategori(form) : updateKategori(modal.id, form); setModal(null); }}
          onClose={() => setModal(null)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title="Kategoriyi sil?"
          desc={<><strong>{confirm.ad}</strong> silinecek. Bu kategorideki {getCount(confirm.id)} kayıt kategorisiz kalacak.</>}
          onConfirm={() => { deleteKategori(confirm.id); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Ana Sayfa
// ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'ozet',        label: '📊 Özet'         },
  { id: 'liste',       label: '📦 Stok Listesi'  },
  { id: 'hareketler',  label: '↕ Hareketler'     },
  { id: 'kategoriler', label: '🏷️ Kategoriler'   },
];

export default function StokTakip() {
  const { isStokYetkili, isStokReadOnly } = useAuth();
  const [activeTab, setActiveTab] = useState('ozet');

  if (!isStokYetkili) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="empty-state">
          <Package size={48} style={{ color: 'var(--text-tertiary)', marginBottom: 14 }} />
          <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Erişim Yetkiniz Yok</h2>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: 0 }}>
            Depo, Muhasebe veya Yönetici yetkisi gereklidir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={22} style={{ color: 'var(--accent)' }} />
            Stok Takip Sistemi
          </h1>
          <p className="page-subtitle">
            Cihaz & malzeme envanteri · Seri numaralı ve adet bazlı ürünler · Giriş / çıkış hareketleri
          </p>
        </div>
        {isStokReadOnly && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: '#f97316', fontWeight: 700,
            background: 'rgba(249,115,22,.12)', padding: '7px 14px',
            borderRadius: 99, border: '1px solid rgba(249,115,22,.25)',
          }}>
            <Eye size={13} /> Salt Okunur
          </div>
        )}
      </div>

      {/* Tab bar — mevcut CSS .tabs / .tab-btn sınıfları */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'ozet'        && <TabOzet setActiveTab={setActiveTab} />}
      {activeTab === 'liste'       && <TabListe readonly={isStokReadOnly} />}
      {activeTab === 'hareketler'  && <TabHareketler />}
      {activeTab === 'kategoriler' && <TabKategoriler readonly={isStokReadOnly} />}
    </div>
  );
}
