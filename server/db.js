const Database = require('../node_modules/better-sqlite3');
const path = require('path');

const DB_DIR = path.join(__dirname, '..');

let faresDb = null;
let linesDb = null;

function getFaresDb() {
  if (!faresDb) {
    faresDb = new Database(
      path.join(DB_DIR, 'fares_20260412000000_20360131235959.sqlite'),
      { readonly: true }
    );
  }
  return faresDb;
}

function getLinesDb() {
  if (!linesDb) {
    linesDb = new Database(
      path.join(DB_DIR, 'lines_20260412000000_20360127235959.sqlite'),
      { readonly: true }
    );
  }
  return linesDb;
}

module.exports = { getFaresDb, getLinesDb };
