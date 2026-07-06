import React from 'react';
import { t } from '../i18n';
import { useLang } from '../App';

export default function ExcelLens() {
  const { lang } = useLang();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', gap: '16px' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-start', margin: 0 }}>
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
          📊
        </div>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {t(lang, 'excelLens')}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            AATools Akıllı Excel Analiz, Filtreleme ve Karşılaştırma Aracı
          </p>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        border: '1px solid var(--border)', 
        borderRadius: 'var(--radius-lg)', 
        overflow: 'hidden', 
        background: 'var(--bg-surface)' 
      }}>
        <iframe 
          src="/excelv2.html" 
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="AATools ExcelLens"
        />
      </div>
    </div>
  );
}
