const Database = require('better-sqlite3');
const faresDb = new Database('fares_20260412000000_20360131235959.sqlite', {readonly: true});

console.log('--- FARES FOR STOP_TYPE = 1 (Standard city bus) AT TZ 3 ---');
const tf = faresDb.prepare("SELECT tf.*, f.fare FROM ticket_fares tf JOIN fares f ON f.fare_id = tf.fare_id WHERE tf.stop_type = 1 AND tf.time_zone_id = 3 AND tf.card_type_id = 1").get();
console.log(tf);

console.log('\n--- FARES FOR STOP_TYPE = 19 (Metro) AT TZ 3 ---');
const tfMetro = faresDb.prepare("SELECT tf.*, f.fare FROM ticket_fares tf JOIN fares f ON f.fare_id = tf.fare_id WHERE tf.stop_type = 19 AND tf.time_zone_id = 3 AND tf.card_type_id = 1").get();
console.log(tfMetro);

faresDb.close();
