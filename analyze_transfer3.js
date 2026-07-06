/**
 * Transfer Kural Analizi - Tam Rapor
 * Tüm kart tiplerinin transfer_discounts davranışını gösterir
 */
const fdb = require('./node_modules/better-sqlite3')('fares_20260412000000_20360131235959.sqlite', {readonly:true});

// Tüm named card types
const namedCards = fdb.prepare('SELECT * FROM card_types ORDER BY card_type_id').all()
  .filter(ct => {
    const d = (ct.description||'').trim();
    return d.length > 0 && !/^KT_\d+$/i.test(d);
  });

// Tüm zaman dilimlerinde her kart tipi için transfer indirimi
const timeZones = [0,1,2,3,4,5,6,7];
const tzNames = {
  0: 'Gece (00:00-06:00)',
  1: 'Sabah Erken (06:00-06:45)',
  2: 'Sabah Geçiş (06:45-07:00)',
  3: 'Sabah Yoğun (07:00-10:30)',
  4: 'Öğle (10:30-15:00)',
  5: 'Öğleden Sonra (15:00-19:00)',
  6: 'Akşam (19:00-23:59)',
  7: 'Gece Geç (24:00+)',
};

console.log('\n======================================================================');
console.log('                 TRANSFER İNDİRİM TAM ANALİZİ');
console.log('======================================================================\n');

console.log('TEMEL ÜCRET TABLOSU (stop_type=1, normal hatlar)');
console.log('─'.repeat(70));
const header = 'Kart Tipi'.padEnd(30) + timeZones.map(tz => ('TZ'+tz).padStart(8)).join('');
console.log(header);
console.log('─'.repeat(70));

namedCards.slice(0, 20).forEach(ct => {
  const desc = `${ct.description.trim()} (${ct.card_type_id})`;
  let row = desc.substring(0, 29).padEnd(30);
  timeZones.forEach(tz => {
    const fare = fdb.prepare('SELECT f.fare FROM ticket_fares tf JOIN fares f ON f.fare_id=tf.fare_id WHERE tf.stop_type=1 AND tf.time_zone_id=? AND tf.card_type_id=? LIMIT 1').get(tz, ct.card_type_id);
    const v = fare ? (fare.fare/100).toFixed(0)+'₺' : '—';
    row += v.padStart(8);
  });
  console.log(row);
});

console.log('\n\nTRANSFER İNDİRİM TABLOSU (transfer_discounts: fare_id referansı)');
console.log('─'.repeat(70));
const header2 = 'Kart Tipi'.padEnd(30) + timeZones.map(tz => ('TZ'+tz).padStart(8)).join('');
console.log(header2);
console.log('─'.repeat(70));

const results = [];
namedCards.slice(0, 20).forEach(ct => {
  const desc = `${ct.description.trim()} (${ct.card_type_id})`;
  let row = desc.substring(0, 29).padEnd(30);
  const ctResult = { cardTypeId: ct.card_type_id, name: ct.description.trim(), tzData: {} };
  timeZones.forEach(tz => {
    const disc = fdb.prepare('SELECT percent FROM transfer_discounts WHERE time_zone_id=? AND card_type_id=? LIMIT 1').get(tz, ct.card_type_id);
    const fareId = disc?.percent ?? 0;
    const fare = fareId > 0 ? fdb.prepare('SELECT fare FROM fares WHERE fare_id=?').get(fareId) : null;
    const val = fare ? fare.fare : null;
    ctResult.tzData[tz] = { fareId, fare: val };
    let display;
    if (!disc) display = '❌';
    else if (fareId === 0) display = '✗';
    else if (val === 0) display = 'FREE';
    else if (val) display = (val/100).toFixed(0)+'₺';
    else display = '?';
    row += display.padStart(8);
  });
  console.log(row);
  results.push(ctResult);
});

console.log('\n  Açıklama: ❌=kayıt yok, ✗=indirim yok (fare_id=0), FREE=ücretsiz, ₺=indirimli aktarma ücreti\n');

console.log('\nKART TİPİ 1,2,3 DETAYLI KARŞILAŞTIRMA');
console.log('─'.repeat(70));

[1, 2, 3].forEach(cid => {
  const ct = namedCards.find(c => c.card_type_id === cid);
  if (!ct) return;
  console.log(`\n${ct.description.trim()} (${cid}):`);
  timeZones.forEach(tz => {
    // Normal bilet fiyatı
    const baseFare1 = fdb.prepare('SELECT f.fare FROM ticket_fares tf JOIN fares f ON f.fare_id=tf.fare_id WHERE tf.stop_type=1 AND tf.time_zone_id=? AND tf.card_type_id=? LIMIT 1').get(tz, cid);
    const baseFare9 = fdb.prepare('SELECT f.fare FROM ticket_fares tf JOIN fares f ON f.fare_id=tf.fare_id WHERE tf.stop_type=9 AND tf.time_zone_id=? AND tf.card_type_id=? LIMIT 1').get(tz, cid);
    
    // Transfer indirimi
    const disc = fdb.prepare('SELECT percent FROM transfer_discounts WHERE time_zone_id=? AND card_type_id=? LIMIT 1').get(tz, cid);
    const fareId = disc?.percent ?? 0;
    const transFare = fareId > 0 ? fdb.prepare('SELECT fare FROM fares WHERE fare_id=?').get(fareId) : null;
    
    const tzLabel = tzNames[tz] || 'TZ'+tz;
    const bf1 = baseFare1 ? (baseFare1.fare/100).toFixed(2)+'₺' : '—';
    const bf9 = baseFare9 ? (baseFare9.fare/100).toFixed(2)+'₺' : '—';
    let tStatus;
    if (fareId === 0) tStatus = '✗ Aktarma indirimi yok (tam ücret)';
    else if (transFare?.fare === 0) tStatus = '✓ ÜCRETSİZ aktarma';
    else if (transFare?.fare) tStatus = `✓ ${(transFare.fare/100).toFixed(2)}₺ aktarma ücreti (fare_id=${fareId})`;
    else tStatus = `? fare_id=${fareId} bulunamadı`;
    
    console.log(`  TZ${tz} (${tzLabel}): bilet=${bf1}/stop1, ${bf9}/stop9 | Transfer: ${tStatus}`);
  });
});

console.log('\n\nSONUÇ ÖZETİ');
console.log('─'.repeat(70));
console.log('Kart tipleri 1 (TAM), 2 (ÖĞRENCİ), 3 (ÖĞRETMEN) için:');
console.log('');
console.log('TZ3 (sabah 07:00-10:30) aktarma ücretleri:');
[1,2,3].forEach(cid => {
  const disc = fdb.prepare('SELECT percent FROM transfer_discounts WHERE time_zone_id=3 AND card_type_id=? LIMIT 1').get(cid);
  const fareId = disc?.percent ?? 0;
  const transFare = fareId > 0 ? fdb.prepare('SELECT fare FROM fares WHERE fare_id=?').get(fareId) : null;
  const ct = fdb.prepare('SELECT description FROM card_types WHERE card_type_id=?').get(cid);
  const name = ct?.description?.trim() || 'KT_'+cid;
  
  if (transFare?.fare !== undefined) {
    console.log(`  ${name} (${cid}): ${(transFare.fare/100).toFixed(2)}₺ aktarma ücreti (fare_id=${fareId})`);
  } else {
    console.log(`  ${name} (${cid}): AKTARMA İNDİRİMİ YOK`);
  }
});

fdb.close();
