/**
 * routes/ego.js
 * EGO Genel Müdürlüğü veri çekme (scraping) endpoint'leri
 * - GET /api/ego/duyurular       → Son duyurular
 * - GET /api/ego/tarifeler       → Ücret tarifesi
 * - GET /api/ego/hatlar          → EGO hat listesi (karşılaştırma için)
 */

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { parse } = require('node-html-parser');

const EGO_BASE = 'https://www.ego.gov.tr';

// Basit in-memory cache: { key: { data, fetchedAt } }
const cache = {};
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 dakika

function isCacheValid(key) {
  return cache[key] && (Date.now() - cache[key].fetchedAt < CACHE_TTL_MS);
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9',
    },
    timeout: 15000,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.text();
}

// ─── GET /api/ego/duyurular ─────────────────────────────────────────────────
router.get('/duyurular', async (req, res) => {
  try {
    if (isCacheValid('duyurular')) {
      return res.json({ fromCache: true, ...cache['duyurular'].data });
    }

    const html = await fetchHtml(`${EGO_BASE}/duyurular`);
    const root = parse(html);

    // EGO duyurular sayfasında liste öğeleri genellikle .card ya da article içinde gelir
    const items = [];
    const cards = root.querySelectorAll('.blog-posts article, .post-item, article.post');

    cards.forEach(card => {
      const titleEl = card.querySelector('h2 a, h3 a, .entry-title a, a[href*="/duyuru"]');
      const dateEl  = card.querySelector('time, .date, .entry-date, .post-date');
      const excerptEl = card.querySelector('p, .excerpt, .entry-content p');

      if (titleEl) {
        items.push({
          title:   titleEl.text.trim(),
          url:     (titleEl.getAttribute('href') || '').startsWith('http')
                     ? titleEl.getAttribute('href')
                     : EGO_BASE + titleEl.getAttribute('href'),
          date:    dateEl  ? dateEl.text.trim() : null,
          excerpt: excerptEl ? excerptEl.text.trim().slice(0, 160) : null,
        });
      }
    });

    // Fallback: eğer yapı farklıysa tüm duyuru linklerini çek
    if (items.length === 0) {
      const links = root.querySelectorAll('a[href*="/duyuru"]');
      const seen = new Set();
      links.forEach(a => {
        const href = a.getAttribute('href') || '';
        const text = a.text.trim();
        if (text.length > 10 && !seen.has(href)) {
          seen.add(href);
          items.push({
            title: text,
            url:   href.startsWith('http') ? href : EGO_BASE + href,
            date:  null,
            excerpt: null,
          });
        }
      });
    }

    const result = {
      count: items.length,
      fetchedAt: new Date().toISOString(),
      items: items.slice(0, 20),
    };

    cache['duyurular'] = { data: result, fetchedAt: Date.now() };
    res.json({ fromCache: false, ...result });
  } catch (err) {
    res.status(502).json({ error: 'EGO sitesine ulaşılamadı', detail: err.message });
  }
});

// ─── GET /api/ego/tarifeler ──────────────────────────────────────────────────
router.get('/tarifeler', async (req, res) => {
  try {
    if (isCacheValid('tarifeler')) {
      return res.json({ fromCache: true, ...cache['tarifeler'].data });
    }

    const html = await fetchHtml(`${EGO_BASE}/sayfa/2098/tasima-ucretleri`);
    const root = parse(html);

    const tables = [];
    root.querySelectorAll('table').forEach(table => {
      const rows = [];
      table.querySelectorAll('tr').forEach(tr => {
        const cells = tr.querySelectorAll('td, th').map(td => td.text.trim());
        if (cells.some(c => c.length > 0)) rows.push(cells);
      });
      if (rows.length > 0) tables.push(rows);
    });

    // Metin içeriğini de çek (tablo dışında ücret bilgisi olabilir)
    const contentEl = root.querySelector('.post-content, article, .entry-content, main');
    const rawText = contentEl
      ? contentEl.text.replace(/\s+/g, ' ').trim().slice(0, 3000)
      : '';

    const result = {
      fetchedAt: new Date().toISOString(),
      tables,
      rawText,
      sourceUrl: `${EGO_BASE}/sayfa/2098/tasima-ucretleri`,
    };

    cache['tarifeler'] = { data: result, fetchedAt: Date.now() };
    res.json({ fromCache: false, ...result });
  } catch (err) {
    res.status(502).json({ error: 'EGO sitesine ulaşılamadı', detail: err.message });
  }
});

// ─── GET /api/ego/hatlar ─────────────────────────────────────────────────────
router.get('/hatlar', async (req, res) => {
  try {
    if (isCacheValid('hatlar')) {
      return res.json({ fromCache: true, ...cache['hatlar'].data });
    }

    const html = await fetchHtml(`${EGO_BASE}/`);
    const root = parse(html);

    // Hat listesi anasayfadaki <select name="hat_no1"> içinde gelir
    const select = root.querySelector('select[name="hat_no1"]');
    const hatlar = [];

    if (select) {
      select.querySelectorAll('option').forEach(opt => {
        const value = opt.getAttribute('value');
        const text  = opt.text.trim();
        if (value && value !== '0') {
          // Örnek metin: "(101 ) - GÖLBAŞI-BAHÇELİEVLER"
          const match = text.match(/\(\s*([\d\-]+)\s*\)\s*[-–]\s*(.+)/);
          hatlar.push({
            egoKodu:  match ? match[1].trim() : value,
            ad:       match ? match[2].trim() : text,
            rawValue: value,
          });
        }
      });
    }

    const result = {
      count: hatlar.length,
      fetchedAt: new Date().toISOString(),
      hatlar,
    };

    cache['hatlar'] = { data: result, fetchedAt: Date.now() };
    res.json({ fromCache: false, ...result });
  } catch (err) {
    res.status(502).json({ error: 'EGO sitesine ulaşılamadı', detail: err.message });
  }
});

// ─── GET /api/ego/karsilastir ─────────────────────────────────────────────────
// DB'deki hatları EGO hat listesiyle karşılaştırır
router.get('/karsilastir', async (req, res) => {
  try {
    const { getLinesDb } = require('../db');
    const db = getLinesDb();

    // EGO hatlarını çek (cache'den veya canlı)
    let egoHatlar;
    if (isCacheValid('hatlar')) {
      egoHatlar = cache['hatlar'].data.hatlar;
    } else {
      const html = await fetchHtml(`${EGO_BASE}/`);
      const root = parse(html);
      const select = root.querySelector('select[name="hat_no1"]');
      egoHatlar = [];
      if (select) {
        select.querySelectorAll('option').forEach(opt => {
          const value = opt.getAttribute('value');
          const text  = opt.text.trim();
          if (value && value !== '0') {
            const match = text.match(/\(\s*([\d\-]+)\s*\)\s*[-–]\s*(.+)/);
            egoHatlar.push({
              egoKodu:  match ? match[1].trim() : value,
              ad:       match ? match[2].trim() : text,
              rawValue: value,
            });
          }
        });
      }
      cache['hatlar'] = { data: { count: egoHatlar.length, fetchedAt: new Date().toISOString(), hatlar: egoHatlar }, fetchedAt: Date.now() };
    }

    // DB'deki hatları çek (sadece line_id ve name)
    const dbHatlar = db.prepare('SELECT line_id, name FROM lines ORDER BY line_id').all();

    /**
     * DB'deki line_id encoding:
     *   ≤ 999  → doğrudan hat numarası (örn. 101 = EGO hattı 101)
     *   > 999  → alt hat / yön kodlaması: base = Math.floor(line_id / 10)
     *            örn. 1011 → hat 101, yön 1 (EGO kodu: 101-1)
     *            örn. 1012 → hat 101, yön 2 (EGO kodu: 101-2)
     *
     * EGO kodu: "101"  → base = 101
     * EGO kodu: "101-1" → base = 101
     */
    function dbBaseId(lineId) {
      return lineId > 999 ? Math.floor(lineId / 10) : lineId;
    }

    // EGO kodlarını base numarasına çevir: "101-1" → 101
    function egoBaseNum(egoKodu) {
      return parseInt(egoKodu.split('-')[0], 10);
    }

    // DB'deki benzersiz base hat numaraları
    const dbBaseSet = new Set(dbHatlar.map(l => dbBaseId(l.line_id)));

    // EGO'daki benzersiz base hat numaraları
    const egoBaseSet = new Set(egoHatlar.map(h => egoBaseNum(h.egoKodu)));

    // EGO'da var ama DB'de yok olanlar (base numarasına göre)
    // Tekrar sayılmaması için EGO kodlarını de-duplicate et
    const seenEgo = new Set();
    const sadeceEGOde = egoHatlar.filter(h => {
      const base = egoBaseNum(h.egoKodu);
      if (seenEgo.has(base)) return false;
      if (!dbBaseSet.has(base)) {
        seenEgo.add(base);
        return true;
      }
      return false;
    });

    // DB'de var ama EGO'da yok olanlar (DB'de de base'e göre de-duplicate)
    const seenDb = new Set();
    const sadeceDBrede = dbHatlar.filter(l => {
      const base = dbBaseId(l.line_id);
      if (seenDb.has(base)) return false;
      if (!egoBaseSet.has(base)) {
        seenDb.add(base);
        return true;
      }
      return false;
    });

    // Her iki tarafta da olanlar (DB satırları, base eşleşimi)
    const seenOrtak = new Set();
    const ortaklar = dbHatlar.filter(l => {
      const base = dbBaseId(l.line_id);
      if (seenOrtak.has(base)) return false;
      if (egoBaseSet.has(base)) {
        seenOrtak.add(base);
        return true;
      }
      return false;
    });

    res.json({
      fetchedAt: new Date().toISOString(),
      ozet: {
        dbToplamHat: dbHatlar.length,
        dbBenzersizHat: dbBaseSet.size,
        egoToplamHat: egoHatlar.length,
        egoBenzersizHat: egoBaseSet.size,
        ortakHatSayisi: ortaklar.length,
        sadeceEGOdeCount: sadeceEGOde.length,
        sadeceDBredeCount: sadeceDBrede.length,
      },
      sadeceEGOde: sadeceEGOde.slice(0, 100),
      sadeceDBrede: sadeceDBrede.slice(0, 100),
      ortaklar: ortaklar.slice(0, 100),
    });
  } catch (err) {
    res.status(502).json({ error: 'Karşılaştırma hatası', detail: err.message });
  }
});

module.exports = router;
