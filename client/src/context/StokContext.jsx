/**
 * StokContext.jsx - Kapsamlı stok yönetim sistemi
 * - Özelleştirilebilir kategoriler
 * - Seri numaralı & adet bazlı ürünler
 * - Stok hareketleri (giriş/çıkış/iade)
 * - Minimum stok uyarıları
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const StokContext = createContext(null);

const KEYS = {
  kategoriler: 'aatools-stok-kategoriler',
  urunler:     'aatools-stok-urunler',
  hareketler:  'aatools-stok-hareketler',
};

// ── Varsayılan Kategoriler ────────────────────────────────────────────────────
export const VARSAYILAN_KATEGORILER = [
  { id: 'kat-validator', ad: 'Validatör & POS',        ikon: '📟', renk: '#8b5cf6', aciklama: 'VAL8, DCP4, POS terminaller' },
  { id: 'kat-bilgisayar',ad: 'Bilgisayar & Yazılım',   ikon: '🖥️', renk: '#2563eb', aciklama: 'Laptop, masaüstü, tablet' },
  { id: 'kat-kart',      ad: 'Kartlar',                ikon: '💳', renk: '#10b981', aciklama: 'Akıllı kartlar, RFID, ulaşım kartları' },
  { id: 'kat-entrust',   ad: 'Entrust Cihazları',      ikon: '🔒', renk: '#ef4444', aciklama: 'Güvenlik & şifreleme cihazları' },
  { id: 'kat-kamera',    ad: 'Kamera & Scanner',       ikon: '📷', renk: '#06b6d4', aciklama: 'IP kameralar, barkod okuyucular' },
  { id: 'kat-donanim',   ad: 'Donanım & Malzeme',      ikon: '🔧', renk: '#f97316', aciklama: 'Vida, demir, kablo, aksesuar' },
  { id: 'kat-diger',     ad: 'Diğer',                  ikon: '📦', renk: '#6b7280', aciklama: 'Diğer ekipmanlar' },
];

// ── Durum listesi ────────────────────────────────────────────────────────────
export const DURUMLAR = [
  { id: 'depoda',     label: 'Depoda',      renk: '#10b981', ikon: '🏭' },
  { id: 'dagitildi',  label: 'Dağıtıldı',   renk: '#6366f1', ikon: '🚌' },
  { id: 'serviste',   label: 'Serviste',    renk: '#f97316', ikon: '🔧' },
  { id: 'hurda',      label: 'Hurda',       renk: '#ef4444', ikon: '🗑️' },
];

// ── Hareket tipleri ───────────────────────────────────────────────────────────
export const HAREKET_TIPLERI = [
  { id: 'giris',    label: 'Depoya Giriş',    renk: '#10b981', ikon: '↓' },
  { id: 'cikis',    label: 'Depodan Çıkış',   renk: '#6366f1', ikon: '↑' },
  { id: 'iade',     label: 'İade (Geri Dönüş)',renk: '#f97316', ikon: '↩' },
  { id: 'sayim',    label: 'Sayım Düzeltmesi', renk: '#8b5cf6', ikon: '⚖' },
  { id: 'hurda',    label: 'Hurdaya Ayırma',   renk: '#ef4444', ikon: '🗑' },
];

// ── Birim listesi ─────────────────────────────────────────────────────────────
export const BIRIMLER = ['adet', 'kutu', 'paket', 'kg', 'metre', 'rulo', 'takım', 'çift'];

// ── Helper ────────────────────────────────────────────────────────────────────
function read(key)       { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
function uid(prefix = 'id') { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ── Provider ──────────────────────────────────────────────────────────────────
export function StokProvider({ children }) {
  const [kategoriler,  setKategoriler]  = useState(() => {
    const stored = read(KEYS.kategoriler);
    return stored.length > 0 ? stored : VARSAYILAN_KATEGORILER;
  });
  const [urunler,    setUrunler]    = useState(() => read(KEYS.urunler));
  const [hareketler, setHareketler] = useState(() => read(KEYS.hareketler));

  // ── Kategori CRUD ─────────────────────────────────────────────────────────
  const addKategori = useCallback((kat) => {
    const yeni = { ...kat, id: uid('kat') };
    const liste = [...read(KEYS.kategoriler), yeni];
    if (liste.length === 1 && read(KEYS.kategoriler).length === 0) {
      // ilk kez kayıt
    }
    const guncel = [...kategoriler, yeni];
    write(KEYS.kategoriler, guncel);
    setKategoriler(guncel);
    return yeni;
  }, [kategoriler]);

  const updateKategori = useCallback((id, updates) => {
    const guncel = kategoriler.map(k => k.id === id ? { ...k, ...updates } : k);
    write(KEYS.kategoriler, guncel);
    setKategoriler(guncel);
  }, [kategoriler]);

  const deleteKategori = useCallback((id) => {
    const guncel = kategoriler.filter(k => k.id !== id);
    write(KEYS.kategoriler, guncel);
    setKategoriler(guncel);
  }, [kategoriler]);

  // ── Ürün CRUD ─────────────────────────────────────────────────────────────
  const addUrun = useCallback((urun, userId) => {
    const yeni = {
      ...urun,
      id: uid('urun'),
      kayitTarihi: new Date().toISOString(),
      ekleyenId: userId,
    };
    const guncel = [yeni, ...read(KEYS.urunler)];
    write(KEYS.urunler, guncel);
    setUrunler(guncel);

    // İlk hareketi kaydet
    _addHareket({
      urunId: yeni.id,
      tip: 'giris',
      tarih: new Date().toISOString().split('T')[0],
      miktar: urun.tip === 'adet' ? (urun.miktar || 1) : 1,
      aciklama: 'İlk kayıt — depoya giriş',
      ekleyenId: userId,
    });

    return yeni;
  }, []);

  const updateUrun = useCallback((id, updates, userId) => {
    const liste = read(KEYS.urunler);
    const idx = liste.findIndex(u => u.id === id);
    if (idx === -1) return false;
    const onceki = liste[idx];
    liste[idx] = { ...onceki, ...updates, guncellemeTarihi: new Date().toISOString() };
    write(KEYS.urunler, liste);
    setUrunler([...liste]);
    return true;
  }, []);

  const deleteUrun = useCallback((id) => {
    const guncel = read(KEYS.urunler).filter(u => u.id !== id);
    write(KEYS.urunler, guncel);
    setUrunler(guncel);
  }, []);

  // ── Hareket ───────────────────────────────────────────────────────────────
  function _addHareket(hareket) {
    const yeni = { ...hareket, id: uid('hrk'), kayitTarihi: new Date().toISOString() };
    const guncel = [yeni, ...read(KEYS.hareketler)].slice(0, 5000);
    write(KEYS.hareketler, guncel);
    setHareketler(guncel);
    return yeni;
  }

  const addHareket = useCallback((hareket, userId) => {
    const h = _addHareket({ ...hareket, ekleyenId: userId });

    // Adet bazlı ürünlerin miktarını güncelle
    const urunList = read(KEYS.urunler);
    const urunIdx = urunList.findIndex(u => u.id === hareket.urunId);
    if (urunIdx !== -1 && urunList[urunIdx].tip === 'adet') {
      const u = urunList[urunIdx];
      const delta = ['giris', 'iade'].includes(hareket.tip)
        ? +(hareket.miktar || 0)
        : -+(hareket.miktar || 0);
      urunList[urunIdx] = { ...u, miktar: Math.max(0, (u.miktar || 0) + delta) };
      write(KEYS.urunler, urunList);
      setUrunler([...urunList]);
    }
    // Seri numaralı: durumu güncelle
    if (urunIdx !== -1 && urunList[urunIdx].tip === 'seri') {
      let yeniDurum = urunList[urunIdx].durum;
      if (hareket.tip === 'cikis')  yeniDurum = 'dagitildi';
      if (hareket.tip === 'iade' || hareket.tip === 'giris') yeniDurum = 'depoda';
      if (hareket.tip === 'hurda')  yeniDurum = 'hurda';
      urunList[urunIdx] = { ...urunList[urunIdx], durum: yeniDurum };
      write(KEYS.urunler, urunList);
      setUrunler([...urunList]);
    }
    return h;
  }, []);

  const getUrunHareketleri = useCallback((urunId) => {
    return read(KEYS.hareketler).filter(h => h.urunId === urunId);
  }, []);

  // ── Özet istatistikler ─────────────────────────────────────────────────────
  const getOzet = useCallback(() => {
    const liste = read(KEYS.urunler);
    const katList = kategoriler;
    const kritikStok = liste.filter(u => u.tip === 'adet' && u.minMiktar && u.miktar <= u.minMiktar);
    return {
      toplamSeri:    liste.filter(u => u.tip === 'seri').length,
      toplamAdet:    liste.filter(u => u.tip === 'adet').length,
      depoda:        liste.filter(u => u.durum === 'depoda' && u.tip === 'seri').length,
      dagitildi:     liste.filter(u => u.durum === 'dagitildi').length,
      serviste:      liste.filter(u => u.durum === 'serviste').length,
      hurda:         liste.filter(u => u.durum === 'hurda').length,
      kritikStok:    kritikStok.length,
      kritikUrunler: kritikStok,
      kategoriDagilim: katList.map(k => ({
        ...k,
        count: liste.filter(u => u.kategoriId === k.id).length,
      })),
    };
  }, [kategoriler]);

  const refresh = useCallback(() => {
    setKategoriler(() => {
      const s = read(KEYS.kategoriler);
      return s.length > 0 ? s : VARSAYILAN_KATEGORILER;
    });
    setUrunler(read(KEYS.urunler));
    setHareketler(read(KEYS.hareketler));
  }, []);

  return (
    <StokContext.Provider value={{
      kategoriler, urunler, hareketler,
      addKategori, updateKategori, deleteKategori,
      addUrun, updateUrun, deleteUrun,
      addHareket, getUrunHareketleri,
      getOzet, refresh,
    }}>
      {children}
    </StokContext.Provider>
  );
}

export function useStok() {
  const ctx = useContext(StokContext);
  if (!ctx) throw new Error('useStok must be used within StokProvider');
  return ctx;
}
