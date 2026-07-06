import React, { useState } from 'react';
import { Sparkles, Copy, Download, Trash, Check, AlertCircle } from 'lucide-react';
import { t } from '../i18n';
import { useLang } from '../App';

export default function DataCleaner() {
  const { lang } = useLang();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Clean options
  const [opts, setOpts] = useState({
    trim: true,
    removeDoubleSpaces: true,
    removeEmptyLines: false,
    formatPhones: false,
    formatDates: false,
    extractEmails: false,
    regexReplace: false
  });
  
  const [regexFind, setRegexFind] = useState('');
  const [regexReplaceWith, setRegexReplaceWith] = useState('');

  const toggleOpt = (key) => {
    setOpts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const cleanData = () => {
    if (!input) {
      setOutput('');
      return;
    }

    let result = input;

    // 1. Trim lines
    if (opts.trim) {
      result = result.split('\n').map(l => l.trim()).join('\n');
    }

    // 2. Remove double/multiple spaces
    if (opts.removeDoubleSpaces) {
      result = result.replace(/[ \t]+/g, ' ');
    }

    // 3. Remove empty lines
    if (opts.removeEmptyLines) {
      result = result.split('\n').filter(l => l.trim() !== '').join('\n');
    }

    // 4. Format Phones (+90 5xx ...)
    if (opts.formatPhones) {
      result = result.split('\n').map(line => {
        // Find sequences of digits that look like phone numbers
        return line.replace(/(\+?\d[\d\s-]{8,14}\d)/g, (match) => {
          const digits = match.replace(/\D/g, '');
          if (digits.length === 10) {
            return `+90 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
          } else if (digits.length === 11 && digits.startsWith('0')) {
            return `+90 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
          } else if (digits.length === 12 && digits.startsWith('90')) {
            return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
          }
          return match; // return original if it doesn't fit standard TR length
        });
      }).join('\n');
    }

    // 5. Format Dates to YYYY-MM-DD
    if (opts.formatDates) {
      result = result.split('\n').map(line => {
        // Standardize formats like DD.MM.YYYY, DD/MM/YYYY to YYYY-MM-DD
        return line.replace(/(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})/g, (match, d, m, y) => {
          const pad = (s) => s.padStart(2, '0');
          return `${y}-${pad(m)}-${pad(d)}`;
        });
      }).join('\n');
    }

    // 6. Extract Emails (One email per line)
    if (opts.extractEmails) {
      const emails = result.match(/[\w.+\-]+@[\w.\-]+\.\w{2,}/g) || [];
      result = emails.join('\n');
    }

    // 7. Regex Find and Replace
    if (opts.regexReplace && regexFind) {
      try {
        const re = new RegExp(regexFind, 'g');
        result = result.replace(re, regexReplaceWith);
      } catch (err) {
        console.error('Regex Hatası:', err);
      }
    }

    setOutput(result);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `cleaned_data_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          ✨
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Gelişmiş Veri Temizleyici ve Formatlayıcı
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Karışık listelerdeki telefon numaralarını, tarihleri düzenleyin, e-postaları ayıklayın veya regex aramaları uygulayın.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>
        {/* Editor Areas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Input Area */}
          <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Giriş Verisi</h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                width: '100%', height: '180px', background: 'var(--bg-base)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', padding: '12px', fontSize: '13px',
                fontFamily: 'var(--mono)', outline: 'none', resize: 'vertical'
              }}
              placeholder="Temizlenecek veriyi buraya yapıştırın..."
            />
          </div>

          {/* Clean Trigger Button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={cleanData}
              disabled={!input.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
            >
              <Sparkles size={16} /> Veriyi Temizle
            </button>
          </div>

          {/* Output Area */}
          {output && (
            <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--accent2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temizlenmiş Veri</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={handleCopy}>
                    {copied ? <Check size={12} style={{ color: 'var(--accent2)' }} /> : <Copy size={12} />}
                    {copied ? 'Kopyalandı' : 'Kopyala'}
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={handleDownload}>
                    <Download size={12} /> İndir (.txt)
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={output}
                style={{
                  width: '100%', height: '180px', background: 'var(--bg-base)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', padding: '12px', fontSize: '13px',
                  fontFamily: 'var(--mono)', outline: 'none', resize: 'vertical'
                }}
              />
            </div>
          )}
        </div>

        {/* Right Side Panel: Clean Options */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Temizleme Ayarları</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input type="checkbox" checked={opts.trim} onChange={() => toggleOpt('trim')} style={{ width: '15px', height: '15px', accentColor: 'var(--accent)' }} />
              Satır başı/sonu boşlukları sil (Trim)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input type="checkbox" checked={opts.removeDoubleSpaces} onChange={() => toggleOpt('removeDoubleSpaces')} style={{ width: '15px', height: '15px', accentColor: 'var(--accent)' }} />
              Çift boşlukları tek boşluğa indir
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input type="checkbox" checked={opts.removeEmptyLines} onChange={() => toggleOpt('removeEmptyLines')} style={{ width: '15px', height: '15px', accentColor: 'var(--accent)' }} />
              Boş satırları tamamen temizle
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input type="checkbox" checked={opts.formatPhones} onChange={() => toggleOpt('formatPhones')} style={{ width: '15px', height: '15px', accentColor: 'var(--accent)' }} />
              Telefonları formatla (+90 5xx...)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input type="checkbox" checked={opts.formatDates} onChange={() => toggleOpt('formatDates')} style={{ width: '15px', height: '15px', accentColor: 'var(--accent)' }} />
              Tarihleri formatla (YYYY-MM-DD)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input type="checkbox" checked={opts.extractEmails} onChange={() => toggleOpt('extractEmails')} style={{ width: '15px', height: '15px', accentColor: 'var(--accent)' }} />
              E-postaları ayıkla (Liste çıkarır)
            </label>

            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }}></div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              <input type="checkbox" checked={opts.regexReplace} onChange={() => toggleOpt('regexReplace')} style={{ width: '15px', height: '15px', accentColor: 'var(--accent)' }} />
              Regex Bul & Değiştir
            </label>

            {opts.regexReplace && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '22px' }}>
                <div>
                  <label className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Bul (Regex)</label>
                  <input 
                    type="text" 
                    value={regexFind} 
                    onChange={(e) => setRegexFind(e.target.value)}
                    className="select-filter" 
                    style={{ width: '100%', height: '32px', padding: '0 8px', fontSize: '12px' }}
                    placeholder="ör. [0-9]+"
                  />
                </div>
                <div>
                  <label className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Değiştir</label>
                  <input 
                    type="text" 
                    value={regexReplaceWith} 
                    onChange={(e) => setRegexReplaceWith(e.target.value)}
                    className="select-filter" 
                    style={{ width: '100%', height: '32px', padding: '0 8px', fontSize: '12px' }}
                    placeholder="ör. X"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
