import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, Clock, CreditCard, Bus, Zap, AlertCircle, CheckCircle, XCircle, ChevronDown, RotateCcw, Search } from 'lucide-react';
import { useLang } from '../App';
import { t } from '../i18n';

const BASE = '/api';
const fmt = (v) => v != null ? `${(v / 100).toFixed(2)} ₺` : '—';
const pad = (n) => String(n).padStart(2, '0');

const WEEKDAYS_TR = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
const WEEKDAYS_EN = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

// ─── RawRuleBadge — DB'den gelen ham değeri gösterir ────────
function RawRuleBadge({ rule, small }) {
  // rule: { table, rawRow: { percent, discount_type, interval, ... } }
  const hasRule = !!rule;
  const color = hasRule ? '#f5a623' : '#00d4aa';
  const style = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: small ? '3px 10px' : '6px 16px',
    borderRadius: 999,
    fontSize: small ? 11 : 13,
    fontWeight: 600,
    background: color + '22',
    color: color,
    border: `1px solid ${color}44`,
    whiteSpace: 'nowrap',
  };
  if (!hasRule) {
    return <span style={style}><Zap size={small ? 12 : 14} /> Genel Aktarma (DB)</span>;
  }
  return (
    <span style={style}>
      <AlertCircle size={small ? 12 : 14} />
      Özel Kural (percent={rule.rawRow.percent})
    </span>
  );
}

// ─── FormulaBreakdown — Matematiksel formülü şık ve dinamik gösterir ────────
function FormulaBreakdown({ fd, title, typeColor }) {
  if (!fd) return null;

  const diffPositive = fd.diff > 0;
  
  const accentColor = 'var(--accent)'; 
  const targetColor = '#00d4aa';       
  const purpleColor = '#a78bfa';       
  const orangeColor = '#f97316';       

  return (
    <div style={{ 
      margin: '8px 0', 
      padding: '12px 14px', 
      background: 'var(--bg-hover)', 
      borderRadius: 8, 
      border: '1px solid var(--border)',
      fontFamily: 'JetBrains Mono, monospace', 
      fontSize: 11, 
      lineHeight: 1.8 
    }}>
      <div style={{ 
        fontSize: 10, 
        color: 'var(--text-muted)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.06em', 
        marginBottom: 8,
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>⚡ {title}</span>
        <span style={{ 
          background: fd.type === 'free' ? '#00d4aa22' : fd.type === 'fixed_fee' ? '#f5a62322' : 'var(--accent-glow)',
          color: fd.type === 'free' ? '#00d4aa' : fd.type === 'fixed_fee' ? '#f5a623' : 'var(--accent-light)',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 700,
        }}>
          {fd.type === 'free' ? 'ÜCRETSİZ' : fd.type === 'fixed_fee' ? 'SABİT ÜCRET' : 'TAMAMLAYICI'}
        </span>
      </div>

      {fd.type === 'free' && (
        <div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
            Formül: Aktarma Ücretsiz (0.00 ₺)
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
            {fd.percentUsed === 10 
              ? '• EGO Metro-Ring / Ring-Metro aktarma kuralı (percent=10) geçerlidir.' 
              : '• Kart tipi / EGO kuralları gereğince ücretsiz aktarma uygulanmıştır.'}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Ödenecek Ücret:</span>
            <strong style={{ color: '#00d4aa', fontSize: 13 }}>0.00 ₺</strong>
          </div>
        </div>
      )}

      {fd.type === 'fixed_fee' && (
        <div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 4 }}>
            Formül: Sabit Aktarma Ücreti (Tamamlayıcı Yok)
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
            • discount_type = 4 olduğundan hatlar arası fiyat farkı yansıtılmaz.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Sabit Ücret (fare_id: {fd.baseFareId}):</span>
            <span style={{ color: purpleColor }}>{fmt(fd.base)}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Ödenecek Ücret:</span>
            <strong style={{ color: typeColor, fontSize: 13 }}>{fmt(fd.result)}</strong>
          </div>
        </div>
      )}

      {(fd.type === 'complementary' || fd.type === 'standard') && (
        <div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
            Formül: max(0, 2.hat - 1.hat) + base
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>= max(0, </span>
            <span style={{ color: targetColor }}>{fmt(fd.secondFare)}</span>
            <span style={{ color: 'var(--text-muted)' }}> - </span>
            <span style={{ color: accentColor }}>{fmt(fd.firstFare)}</span>
            <span style={{ color: 'var(--text-muted)' }}>) + </span>
            <span style={{ color: purpleColor }}>{fmt(fd.base)}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>= max(0, </span>
            <span style={{ color: diffPositive ? orangeColor : 'var(--text-muted)' }}>
              {diffPositive ? '+' : ''}{((fd.secondFare - fd.firstFare)/100).toFixed(2)}₺
            </span>
            <span style={{ color: 'var(--text-muted)' }}>) + </span>
            <span style={{ color: purpleColor }}>{fmt(fd.base)}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>= </span>
            <span style={{ color: diffPositive ? orangeColor : 'var(--text-muted)' }}>{fmt(fd.diff)}</span>
            <span style={{ color: 'var(--text-muted)' }}> + </span>
            <span style={{ color: purpleColor }}>{fmt(fd.base)}</span>
            <span style={{ color: 'var(--text-muted)' }}> = </span>
            <strong style={{ color: typeColor, fontSize: 13 }}>{fmt(fd.result)}</strong>
          </div>
        </div>
      )}

      {fd.specificRule && fd.type !== 'free' && fd.type !== 'fixed_fee' && (
        <div style={{ marginTop: 4, fontSize: 9, color: '#f5a623', opacity: 0.85 }}>
          ⚠️ DB'de özel kural var (percent={fd.percentUsed}) — tamamlayıcı formül uygulanıyor.
        </div>
      )}
    </div>
  );
}

// ─── Popüler / Sık Kullanılan Hatlar Listesi ────────
const POPULAR_LINES = [
  { line_id: 902, displayId: '902', name: 'M2 (Koru-Kızılay Metro)', zone_id: 9 },
  { line_id: 237, displayId: '237', name: 'OSTİM METRO - UZAY ÇAĞI - İVEDİK ORG. SAN. (Ring)', zone_id: 32 },
  { line_id: 507, displayId: '507', name: 'PLEVNE MAHALLESİ - ÜMİTKÖY METRO İST. (Ring)', zone_id: 32 },
  { line_id: 354, displayId: '354', name: 'ELMADAĞ SİTELER - GÜLVEREN GENÇLİK PARKI (Bölge)', zone_id: 10 },
  { line_id: 356, displayId: '356', name: 'KIBRISKÖYÜ - BANLİYÖ TREN İSTASYONU (Fixed Fee)', zone_id: 48 },
  { line_id: 994, displayId: '994', name: 'TCDD TAŞIMACILIK BAŞKENTRAY (Banliyö Tren)', zone_id: 6 }
];

// ─── LineSearchInput ─────────────────────────────────────
function LineSearchInput({ label, value, onChange, placeholder }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (value) {
      const valStr = String(value);
      if (!selected || String(selected.line_id) !== valStr) {
        fetch(`${BASE}/transfer/lines-search?q=${encodeURIComponent(valStr)}&limit=5`)
          .then(r => r.json())
          .then(res => {
            const line = res.find(l => String(l.line_id) === valStr);
            if (line) {
              setSelected(line);
              setQuery(line.displayId + ' — ' + line.name);
            }
          })
          .catch(() => {});
      }
    } else {
      setSelected(null);
      setQuery('');
    }
  }, [value, selected]);

  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); return; }
    if (selected && query === `${selected.displayId} — ${selected.name}`) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`${BASE}/transfer/lines-search?q=${encodeURIComponent(query)}&limit=12`)
        .then(r => r.json()).then(setResults).catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [query, selected]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (line) => {
    setSelected(line);
    setQuery(line.displayId + ' — ' + line.name);
    setOpen(false);
    onChange(line.line_id);
  };

  const isQueryEmpty = !query.trim() || (selected && query === `${selected.displayId} — ${selected.name}`);
  const displayedResults = isQueryEmpty ? POPULAR_LINES : results;

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Bus size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '10px 36px 10px 36px',
            color: 'var(--text-primary)', fontSize: 14, outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.target.style.borderColor = 'var(--border-strong)'}
          onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
        />
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelected(null);
              setQuery('');
              onChange(null);
            }}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', padding: 0
            }}
          >
            <XCircle size={14} />
          </button>
        )}
      </div>
      {open && displayedResults.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
          zIndex: 100, maxHeight: 280, overflowY: 'auto',
        }}>
          {isQueryEmpty && (
            <div style={{
              padding: '8px 14px',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--accent-light)',
              background: 'var(--accent-glow)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <span>⭐</span> SIK KULLANILAN HATLAR
            </div>
          )}
          {displayedResults.map(line => (
            <div
              key={line.line_id}
              onClick={() => select(line)}
              style={{
                padding: '9px 14px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                background: 'var(--accent-glow)', color: 'var(--accent-light)',
                borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {line.displayId}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {line.name}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>Z{line.zone_id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FareBar ─────────────────────────────────────────────
function FareBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function TransferScenario() {
  const { lang } = useLang();

  // Form state
  const [fromLine, setFromLine] = useState(null);
  const [toLine, setToLine] = useState(null);
  const [thirdLine, setThirdLine] = useState(null);
  const [hasThirdLeg, setHasThirdLeg] = useState(false);
  const [cardTypeId, setCardTypeId] = useState(1);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [weekday, setWeekday] = useState(1);

  // Data
  const [cardTypes, setCardTypes] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasQueried, setHasQueried] = useState(false);

  // 3-Leg Combination Explorer State
  const [combos, setCombos] = useState([]);
  const [comboSearch, setComboSearch] = useState('');
  const [comboPage, setComboPage] = useState(1);
  const [comboTotalPages, setComboTotalPages] = useState(1);
  const [comboTotal, setComboTotal] = useState(0);
  const [comboLoading, setComboLoading] = useState(false);
  const [comboFilter, setComboFilter] = useState('all'); // 'all', 'diff', 'free', 'noRule'

  const fetchCombos = useCallback(() => {
    setComboLoading(true);
    fetch(`${BASE}/transfer/three-leg-combinations?page=${comboPage}&limit=10&q=${encodeURIComponent(comboSearch)}&cardType=${cardTypeId}&hour=${hour}&minute=${minute}&weekday=${weekday}&filter=${comboFilter}`)
      .then(r => r.json())
      .then(d => {
        setCombos(d.results || []);
        setComboTotal(d.total || 0);
        setComboTotalPages(d.totalPages || 1);
        setComboLoading(false);
      })
      .catch(() => {
        setComboLoading(false);
      });
  }, [comboPage, comboSearch, cardTypeId, hour, minute, weekday, comboFilter]);

  useEffect(() => {
    fetchCombos();
  }, [comboPage, comboSearch, fetchCombos]);

  // Reset page to 1 on input or filter change
  useEffect(() => {
    setComboPage(1);
  }, [cardTypeId, hour, minute, weekday, comboFilter]);

  // Load a combo into the inputs
  const handleLoadCombo = (combo) => {
    const getFirstLineId = (sample) => {
      const match = sample.match(/^(\d+)\s*\(/);
      return match ? match[1] : null;
    };
    const lineA = getFirstLineId(combo.sampleA);
    const lineB = getFirstLineId(combo.sampleB);
    const lineC = getFirstLineId(combo.sampleC);

    if (lineA && lineB && lineC) {
      setFromLine(lineA);
      setToLine(lineB);
      setThirdLine(lineC);
      setHasThirdLeg(true);
      setHasQueried(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetch(`${BASE}/transfer/card-types`).then(r => r.json()).then(setCardTypes).catch(() => {});
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!fromLine || !toLine) return;
    // 3. biniş seçili ama hat henüz seçilmemişse bekle
    if (hasThirdLeg && !thirdLine) return;
    setLoading(true);
    setError(null);
    setHasQueried(true);
    let url = `${BASE}/transfer/scenario?fromLine=${fromLine}&toLine=${toLine}&cardType=${cardTypeId}&hour=${hour}&minute=${minute}&weekday=${weekday}`;
    if (hasThirdLeg && thirdLine) url += `&thirdLine=${thirdLine}`;
    fetch(url)
      .then(r => r.json())
      .then(d => { setResult(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [fromLine, toLine, thirdLine, hasThirdLeg, cardTypeId, hour, minute, weekday]);

  // Parametreler değiştiğinde otomatik olarak yeniden analiz et (ilk sorgudan sonra)
  useEffect(() => {
    if (!hasQueried || !fromLine || !toLine) return;
    // 3. hat seçili ama henüz hat seçilmemişse tetikleme
    if (hasThirdLeg && !thirdLine) return;
    handleAnalyze();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardTypeId, weekday, hour, minute, fromLine, toLine, thirdLine, hasThirdLeg]);

  const handleReset = () => { setResult(null); setHasQueried(false); setError(null); };

  // Toggle 3. biniş — sıfırlarken 3. hattı da temizle
  const handleToggleThirdLeg = (val) => {
    setHasThirdLeg(val);
    if (!val) setThirdLine(null);
  };

  // Max total for bar chart
  const maxTotal = result ? Math.max(...(result.cardTypeComparison || []).map(r => r.totalFare ?? 0)) : 0;

  // Color: orange = özel kural var (bilinmiyor), teal = genel kural (DB'den doğrudan)
  const typeColor = result?.hasSpecificRule ? '#f5a623' : '#00d4aa';

  return (
    <div>
      <div className="page-header">
        <h1>Aktarma Senaryo Analizi</h1>
        <p>İki hat arasındaki aktarma ücretini, indirim türünü ve koşullarını analiz edin</p>
      </div>

      {/* ── Input Panel ── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
          {/* From Line */}
          <LineSearchInput
            label="1. HAT"
            placeholder="Hat ara... (örn: 140, Kızılay)"
            value={fromLine}
            onChange={setFromLine}
          />

          {/* Arrow */}
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 2, color: 'var(--text-muted)' }}>
            <ArrowRight size={20} />
          </div>

          {/* To Line */}
          <LineSearchInput
            label="2. HAT (1. AKTARMA)"
            placeholder="Hat ara... (örn: 160, Opera)"
            value={toLine}
            onChange={setToLine}
          />

          {hasThirdLeg && (
            <>
              {/* Arrow 2 */}
              <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 2, color: 'var(--text-muted)' }}>
                <ArrowRight size={20} />
              </div>
              {/* Third Line */}
              <LineSearchInput
                label="3. HAT (2. AKTARMA)"
                placeholder="Hat ara... (örn: 507, Metro)"
                value={thirdLine}
                onChange={setThirdLine}
              />
            </>
          )}
        </div>

        {/* 3. Biniş toggle */}
        <div style={{ marginBottom: 16 }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            fontSize: 13, color: hasThirdLeg ? 'var(--accent-light)' : 'var(--text-secondary)',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={hasThirdLeg}
              onChange={e => handleToggleThirdLeg(e.target.checked)}
              style={{ width: 15, height: 15, accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
            <span>🔀 3. Biniş var mı? <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(2. aktarma / 3. hat)</span></span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Card Type */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Kart Tipi
            </label>
            <select
              className="select-filter"
              style={{ width: '100%', height: 40 }}
              value={cardTypeId}
              onChange={e => setCardTypeId(parseInt(e.target.value))}
            >
              {cardTypes.map(ct => (
                <option key={ct.card_type_id} value={ct.card_type_id}>
                  {ct.description}
                </option>
              ))}
            </select>
          </div>

          {/* Weekday */}
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Gün
            </label>
            <select
              className="select-filter"
              style={{ width: '100%', height: 40 }}
              value={weekday}
              onChange={e => setWeekday(parseInt(e.target.value))}
            >
              {WEEKDAYS_TR.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>

          {/* Time */}
          <div style={{ minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Saat
            </label>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="number" min={0} max={23} value={hour}
                onChange={e => setHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                style={{
                  width: 56, background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '9px 10px', color: 'var(--text-primary)',
                  fontSize: 14, textAlign: 'center', outline: 'none',
                }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 18, fontWeight: 300 }}>:</span>
              <input
                type="number" min={0} max={59} value={minute}
                onChange={e => setMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                style={{
                  width: 56, background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', padding: '9px 10px', color: 'var(--text-primary)',
                  fontSize: 14, textAlign: 'center', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{ height: 40, padding: '0 24px', fontSize: 14 }}
              onClick={handleAnalyze}
              disabled={!fromLine || !toLine || (hasThirdLeg && !thirdLine) || loading}
            >
              {loading ? 'Hesaplanıyor...' : '⚡ Analiz Et'}
            </button>
            {hasQueried && (
              <button className="btn btn-ghost" style={{ height: 40 }} onClick={handleReset}>
                <RotateCcw size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: '#ff6b6b22', border: '1px solid #ff6b6b44', borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 20, color: '#ff6b6b' }}>
          <AlertCircle size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Hero Result Card */}
          <div style={{
            background: `linear-gradient(135deg, ${typeColor}18 0%, var(--bg-card) 60%)`,
            border: `1px solid ${typeColor}44`,
            borderRadius: 'var(--radius-lg)', padding: 28, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: typeColor + '12', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Line journey */}
              <div style={{ flex: 2, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  {/* 1. Hat */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      background: 'var(--accent-glow)', color: 'var(--accent-light)',
                      padding: '4px 14px', borderRadius: 8, fontSize: 18, fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace', marginBottom: 4,
                    }}>
                      {result.fromLine.displayId}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 130, lineHeight: 1.3 }}>{result.fromLine.name}</div>
                  </div>

                  {/* 1. Aktarma oku */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ height: 2, width: '100%', background: `linear-gradient(to right, var(--accent), ${typeColor})`, borderRadius: 1 }} />
                    <RawRuleBadge rule={result.transferRule} small />
                    {result.intervalMinutes > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                        <Clock size={10} />
                        max {result.intervalMinutes} dk
                      </div>
                    )}
                  </div>

                  {/* 2. Hat */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      background: typeColor + '22', color: typeColor,
                      padding: '4px 14px', borderRadius: 8, fontSize: 18, fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace', marginBottom: 4,
                      border: `1px solid ${typeColor}44`,
                    }}>
                      {result.toLine.displayId}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 130, lineHeight: 1.3 }}>{result.toLine.name}</div>
                  </div>

                  {/* 3. hat varsa */}
                  {result.thirdLine && result.secondTransfer && (() => {
                    const c2 = result.secondTransfer.hasSpecificRule ? '#f5a623' : '#00d4aa';
                    return (
                      <>
                        {/* 2. Aktarma oku */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ height: 2, width: '100%', background: `linear-gradient(to right, ${typeColor}, ${c2})`, borderRadius: 1 }} />
                          <RawRuleBadge rule={result.secondTransfer.transferRule} small />
                          {result.secondTransfer.intervalMinutes > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
                              <Clock size={10} />
                              max {result.secondTransfer.intervalMinutes} dk
                            </div>
                          )}
                        </div>
                        {/* 3. Hat */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            background: c2 + '22', color: c2,
                            padding: '4px 14px', borderRadius: 8, fontSize: 18, fontWeight: 700,
                            fontFamily: 'JetBrains Mono, monospace', marginBottom: 4,
                            border: `1px solid ${c2}44`,
                          }}>
                            {result.thirdLine.displayId}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 130, lineHeight: 1.3 }}>{result.thirdLine.name}</div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Context chips */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { icon: '📅', label: WEEKDAYS_TR[result.timeContext.weekday] },
                    { icon: '🕐', label: `${pad(result.timeContext.hour)}:${pad(result.timeContext.minute)}` },
                    { icon: '💳', label: result.cardType.description },
                    { icon: '🏷️', label: `TZ ${result.timeContext.toTimeZoneId}` },
                  ].map((chip, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: 'var(--bg-hover)', border: '1px solid var(--border)',
                      borderRadius: 999, padding: '3px 10px', fontSize: 11, color: 'var(--text-secondary)',
                    }}>
                      <span>{chip.icon}</span> {chip.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fare breakdown */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Ücret Analizi — {result.cardType.description}
                </div>

                {/* 1. hat ücreti */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>1. hat ücreti</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(result.fromFare)}</span>
                </div>

                {/* 2. hat normal ücreti */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>2. hat ücreti (normal)</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(result.toFare)}</span>
                </div>

                {/* Validatör formülü adımları */}
                <FormulaBreakdown fd={result.formulaBreakdown} title="Validatör Formülü" typeColor={typeColor} />

                {/* 1. aktarma ücreti sonucu */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>1. aktarma ücreti</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: typeColor, fontFamily: 'JetBrains Mono, monospace' }}>{fmt(result.transferFare)}</span>
                </div>

                {/* 2. aktarma varsa */}
                {result.thirdLine && result.secondTransfer && (() => {
                  const c2 = result.secondTransfer.hasSpecificRule ? '#f5a623' : '#00d4aa';
                  const diff2 = result.secondTransfer.transferFareDiff ?? 0;
                  const base2 = result.secondTransfer.transferFareBase;
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>3. hat ücreti (normal)</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(result.secondTransfer.thirdFare)}</span>
                      </div>
                      {/* 2. aktarma formülü */}
                      <FormulaBreakdown fd={result.secondTransfer.formulaBreakdown} title="2. Aktarma Formülü" typeColor={c2} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>2. aktarma ücreti</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: c2, fontFamily: 'JetBrains Mono, monospace' }}>{fmt(result.secondTransfer.transferFare)}</span>
                      </div>
                    </>
                  );
                })()}

                {/* Toplam */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${typeColor}44`, marginTop: 4 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>TOPLAM ödeme</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: typeColor, fontFamily: 'JetBrains Mono, monospace' }}>{fmt(result.totalFare)}</span>
                </div>

                {/* Tasarruf badge — aktarma 2. hatın tam ücretinden düşükse */}
                {result.transferFare !== null && result.toFare > result.transferFare && (
                  <div style={{
                    marginTop: 10, padding: '6px 12px',
                    background: '#00d4aa18', border: '1px solid #00d4aa44',
                    borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 11, color: '#00d4aa' }}>💰 1. Aktarma Tasarrufu</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#00d4aa', fontFamily: 'JetBrains Mono, monospace' }}>
                      {fmt(result.toFare - result.transferFare)}
                    </span>
                  </div>
                )}
                {result.secondTransfer && result.secondTransfer.transferFare !== null && result.secondTransfer.thirdFare > result.secondTransfer.transferFare && (
                  <div style={{
                    marginTop: 6, padding: '6px 12px',
                    background: '#00d4aa18', border: '1px solid #00d4aa44',
                    borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 11, color: '#00d4aa' }}>💰 2. Aktarma Tasarrufu</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#00d4aa', fontFamily: 'JetBrains Mono, monospace' }}>
                      {fmt(result.secondTransfer.thirdFare - result.secondTransfer.transferFare)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Transfer Rule Detail ── */}
          {result.hasSpecificRule && (
            <div className="table-card">
              <div className="table-toolbar">
                <h2>📊 DB Özel Aktarma Kuralları</h2>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  transfers_according_to_previous_line · previous_line_id={result.fromLine.zone_id} → line_id={result.toLine.zone_id}
                </span>
              </div>
              {/* DB kaynağı notu */}
              <div style={{ padding: '10px 20px', background: '#f5a62310', borderBottom: '1px solid #f5a62330', fontSize: 11, color: '#f5a623', fontFamily: 'JetBrains Mono, monospace' }}>
                TABLO: transfers_according_to_previous_line &nbsp;|&nbsp; WHERE previous_line_id={result.fromLine.zone_id} AND line_id={result.toLine.zone_id}
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>transfer_num</th>
                    <th>interval (dk)</th>
                    <th>threshold_time</th>
                    <th>percent</th>
                    <th>discount_type</th>
                    <th>flags</th>
                  </tr>
                </thead>
                <tbody>
                  {result.allTransferRules.map((rule, i) => (
                    <tr key={i} style={{ background: rule.rawRow.transfer_num === 1 ? 'var(--bg-active)' : undefined }}>
                      <td><span className="badge badge-blue">#{rule.rawRow.transfer_num}</span></td>
                      <td><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{rule.rawRow.interval}</span></td>
                      <td><span className="mono text-muted">{rule.rawRow.threshold_time ?? '—'}</span></td>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#f5a623', fontSize: 14 }}>
                          {rule.rawRow.percent}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>
                          {rule.rawRow.discount_type ?? 'null'}
                        </span>
                      </td>
                      <td><span className="mono text-muted">{rule.rawRow.flags ?? '0'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 20px', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                ⚠️ Bu değerler yorumlanmadan doğrudan DB'den alınmıştır. <code>percent</code> ve <code>discount_type</code> sütunlarının anlamı validatör firmware'ine bağlıdır — AATools tarafından hiçbir yorum eklenmemiştir.
              </div>
            </div>
          )}

          {/* ── No Specific Rule Info ── */}
          {!result.hasSpecificRule && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '16px 20px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                ℹ️ transfers_according_to_previous_line — Özel kural bulunamadı
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '8px 12px', borderRadius: 6, marginBottom: 10 }}>
                WHERE previous_line_id={result.fromLine.zone_id} AND line_id={result.toLine.zone_id} → 0 satır
              </div>
              {result.generalTransferFare?.fare !== null && result.generalTransferFare?.fare !== undefined && (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  <div><strong>Genel aktarma ücreti:</strong> transfer_discounts tablosundan alındı</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                    transfer_discounts WHERE card_type_id={result.cardType.cardTypeId} AND time_zone_id={result.timeContext.toTimeZoneId} → percent={result.generalTransferFare.fareId}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                    fares WHERE fare_id={result.generalTransferFare.fareId} → fare={result.generalTransferFare.fare} ({(result.generalTransferFare.fare / 100).toFixed(2)} ₺)
                  </div>
                  <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 11 }}>
                    Süre penceresi: {result.generalTransferFare.windowMinutes} dk
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── DB Data Warning (isTransferActive=0) ── */}
          {result.dataWarning && (
            <div style={{
              background: '#f5a62318', border: '1px solid #f5a62344',
              borderRadius: 'var(--radius-md)', padding: '14px 18px',
              display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <AlertCircle size={16} style={{ color: '#f5a623', flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f5a623', marginBottom: 4 }}>
                  ⚠️ Eksik Veri Uyarısı
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Bu hat için <strong>{result.cardType?.description}</strong> kartının aktarma kaydı DB'de <code>isTransferActive=0</code> olarak işaretli — yani
                  bu aktarma kuralı mevcut tarife DB versiyonunda tanımlı değil veya devre dışı.
                  Validatörde gerçekte <strong>ücretsiz ya da farklı bir aktarma</strong> uygulanıyor olabilir.
                  Bu tür kurallar (örn: otobüs↔metro ücretsiz aktarma) bazen KENT kart firmware katmanında veya
                  ayrı bir tarife dosyasında saklanır.
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  <code>subscr_ticket_taken</code> tablosu · Hat {result.toLine?.displayId} · {result.cardType?.description} · isTransferActive=0
                </div>
              </div>
            </div>
          )}

          {/* ── Card Type Comparison Table ── */}
          <div className="table-card">
            <div className="table-toolbar">
              <h2>💳 Kart Tipi Karşılaştırması</h2>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Aynı hat çifti — tüm kart tipleri
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kart Tipi</th>
                    <th>1. Hat</th>
                    <th>2. Hat (normal)</th>
                    <th>Aktarma Ücreti</th>
                    <th>Toplam</th>
                    <th>Not</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.cardTypeComparison || [])
                    .filter(row => row.fromFare != null || row.toFare != null)
                    .map((row, i) => {
                      const isSelected = row.cardTypeId === result.cardType.cardTypeId;
                      const saving = !result.hasSpecificRule && row.transferFare !== null ? (row.toFare ?? 0) - row.transferFare : null;
                      return (
                        <tr key={i} style={{ background: isSelected ? 'var(--bg-active)' : undefined }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {isSelected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />}
                              <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 400 }}>{row.description}</span>
                            </div>
                          </td>
                          <td>
                            <span className="fare-value" style={{ fontSize: 12 }}>{fmt(row.fromFare)}</span>
                          </td>
                          <td>
                            <span className="mono text-muted" style={{ fontSize: 12 }}>{fmt(row.toFare)}</span>
                          </td>
                          <td>
                            {result.hasSpecificRule
                              ? <span style={{ fontSize: 11, color: '#f5a623', fontFamily: 'JetBrains Mono, monospace' }}>DB özel kural</span>
                              : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#00d4aa', fontSize: 13 }}>{fmt(row.transferFare)}</span>
                            }
                          </td>
                          <td>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                                  {row.totalFare !== null ? fmt(row.totalFare) : '—'}
                                </span>
                              </div>
                              <FareBar value={row.totalFare ?? 0} max={maxTotal} color={result.hasSpecificRule ? '#f5a623' : '#00d4aa'} />
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                              {row.transferNote}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Subscription Info ── */}
          {(result.fromSubscription || result.toSubscription) && (
            <div className="table-card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ margin: 0, fontSize: 14 }}>🎫 Abonman Bilgisi</h2>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[
                  { line: result.fromLine, subscr: result.fromSubscription, label: '1. Hat' },
                  { line: result.toLine, subscr: result.toSubscription, label: '2. Hat' },
                ].map(({ line, subscr, label }) => subscr && (
                  <div key={line.line_id} style={{
                    flex: 1, minWidth: 200, background: 'var(--bg-hover)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label} — Hat {line.displayId}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className={`badge ${subscr.ticket === 255 ? 'badge-red' : 'badge-green'}`}>
                        {subscr.ticket === 255 ? 'Abonman Geçersiz' : `Bilet: ${subscr.ticket}`}
                      </span>
                      <span className={`badge ${subscr.isTransferActive ? 'badge-green' : 'badge-orange'}`}>
                        {subscr.isTransferActive ? 'Aktarma Aktif' : 'Aktarma Devre Dışı'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Zone Info ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { line: result.fromLine, tz: result.timeContext.fromTimeZoneId, label: '1. Hat Zaman Dilimi' },
              { line: result.toLine, tz: result.timeContext.toTimeZoneId, label: '2. Hat Zaman Dilimi' },
            ].map(({ line, tz, label }) => (
              <div key={line.line_id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '14px 18px',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                    color: 'var(--accent-light)',
                  }}>
                    {line.displayId}
                  </span>
                  <span className="text-muted">—</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{line.name}</span>
                  <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>TZ {tz}</span>
                  <span className="badge badge-orange">Zone {line.zone_id}</span>
                  {line.hasManualFare && <span className="badge badge-purple">Özel Tarife</span>}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ── Empty state ── */}
      {!hasQueried && !loading && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🚌⚡🚌</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Aktarma Senaryo Analizörü
          </div>
          <div style={{ fontSize: 13, maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>
            İki hat seçin, kart tipinizi ve saatinizi belirleyin. Aktarma türünü, ücretini ve tüm kart tiplerini karşılaştırın.
          </div>
        </div>
      )}

      {/* ── 3-Leg Combination Explorer ── */}
      <div className="table-card" style={{ marginTop: 24 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              🔀 3. Binişli Aktarma Rehberi
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Veritabanındaki tüm <strong>{comboTotal.toLocaleString('tr-TR')}</strong> adet geçerli 3 binişli hat kombinasyonunu arayın ve yükleyin.
            </p>
          </div>
          {/* Live Computed CSV Download Button */}
          <a
            href={`${BASE}/transfer/export-simulated-csv?cardType=${cardTypeId}&hour=${hour}&minute=${minute}&weekday=${weekday}`}
            download="three_leg_simulated_fares.csv"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 'var(--radius-md)', padding: '8px 16px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', textDecoration: 'none', transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-light)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
          >
            📥 CSV Olarak İndir (Tümünü İndir)
          </a>
        </div>

        {/* Filter Segment Control / Tabs */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--border)', overflowX: 'auto', background: 'var(--bg-hover)' }}>
          {[
            { id: 'all', label: '🔍 Tümü' },
            { id: 'diff', label: '📈 Ücret Farkı Alınanlar (Elmadağ vb.)' },
            { id: 'free', label: '💸 Ücretsiz Aktarmalar' },
            { id: 'noRule', label: '⚠️ Kural Olmayanlar' },
          ].map(tab => {
            const isActive = comboFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setComboFilter(tab.id)}
                style={{
                  background: isActive ? 'var(--accent)' : 'var(--bg-card)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
                onMouseEnter={e => { if(!isActive) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={e => { if(!isActive) e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: 6, padding: '2px 6px', fontSize: 10
                  }}>
                    {comboTotal.toLocaleString('tr-TR')}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Hat adı veya Bölge ID ara... (örn: Pursaklar, Ostim, Zone 9)"
              value={comboSearch}
              onChange={e => { setComboSearch(e.target.value); setComboPage(1); }}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--bg-input)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: '10px 14px',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="fares-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>1. Hat (1. Biniş)</th>
                <th style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>1. Aktarma (2. Biniş)</th>
                <th style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>2. Hat (Metro)</th>
                <th style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>2. Aktarma (3. Biniş)</th>
                <th style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>3. Hat</th>
                <th style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Toplam Ücret</th>
                <th style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', borderBottom: '1px solid var(--border)' }}>Eylem</th>
              </tr>
            </thead>
            <tbody>
              {comboLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Veriler yükleniyor...
                  </td>
                </tr>
              ) : combos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Eşleşen kombinasyon bulunamadı.
                  </td>
                </tr>
              ) : combos.map((c, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
                  {/* Zone A */}
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge badge-orange" style={{ fontWeight: 700 }}>Zone {c.zoneA}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmt(c.fareA)}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.sampleA}>
                        {c.sampleA}
                      </span>
                    </div>
                  </td>
                  {/* Transfer 1 */}
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="badge" style={{ background: c.rule1Color + '22', color: c.rule1Color, border: `1px solid ${c.rule1Color}44`, alignSelf: 'flex-start', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                        {c.rule1} ({c.interval1} dk)
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: c.diffApplied1 ? '#f5a623' : 'var(--text-primary)' }}>
                        {fmt(c.tf1)} {c.diffApplied1 && <span title="Fiyat Farkı Eklendi" style={{ cursor: 'help' }}>📈</span>}
                      </span>
                    </div>
                  </td>
                  {/* Zone B */}
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge badge-purple" style={{ fontWeight: 700 }}>Zone {c.zoneB}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmt(c.fareB)}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.sampleB}>
                        {c.sampleB}
                      </span>
                    </div>
                  </td>
                  {/* Transfer 2 */}
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span className="badge" style={{ background: c.rule2Color + '22', color: c.rule2Color, border: `1px solid ${c.rule2Color}44`, alignSelf: 'flex-start', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                        {c.rule2} ({c.interval2} dk)
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: c.diffApplied2 ? '#f5a623' : 'var(--text-primary)' }}>
                        {fmt(c.tf2)} {c.diffApplied2 && <span title="Fiyat Farkı Eklendi" style={{ cursor: 'help' }}>📈</span>}
                      </span>
                    </div>
                  </td>
                  {/* Zone C */}
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge badge-orange" style={{ fontWeight: 700 }}>Zone {c.zoneC}</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{fmt(c.fareC)}</span>
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.sampleC}>
                        {c.sampleC}
                      </span>
                    </div>
                  </td>
                  {/* Total simulated */}
                  <td style={{ padding: '14px 20px', fontSize: 13 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: 15, color: 'var(--accent-light)' }}>
                        {fmt(c.total)}
                      </span>
                      {c.savings > 0 && (
                        <span style={{ fontSize: 10, color: '#00d4aa', fontWeight: 600 }}>
                          💰 {fmt(c.savings)} kar
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleLoadCombo(c)}
                      style={{
                        background: 'var(--accent-glow)', color: 'var(--accent-light)',
                        border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-sm)',
                        padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--accent)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--accent-glow)';
                        e.currentTarget.style.color = 'var(--accent-light)';
                      }}
                    >
                      Senaryoyu Yükle ⚡
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {comboTotalPages > 1 && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-hover)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Sayfa <strong>{comboPage}</strong> / <strong>{comboTotalPages}</strong> (Toplam <strong>{comboTotal.toLocaleString('tr-TR')}</strong> kayıt)
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                disabled={comboPage === 1}
                onClick={() => setComboPage(p => Math.max(1, p - 1))}
                style={{
                  background: 'var(--bg-card)', color: comboPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  padding: '5px 12px', fontSize: 12, cursor: comboPage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ◀ Önceki
              </button>
              <button
                disabled={comboPage === comboTotalPages}
                onClick={() => setComboPage(p => Math.min(comboTotalPages, p + 1))}
                style={{
                  background: 'var(--bg-card)', color: comboPage === comboTotalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  padding: '5px 12px', fontSize: 12, cursor: comboPage === comboTotalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Sonraki ▶
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
