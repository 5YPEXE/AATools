// api.js — Centralized API helper
// Uses relative URL — Vite dev server proxies /api → http://localhost:3001/api

const BASE_URL = '/api';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  return res.json();
}

export const api = {
  // Stats
  getSummary: () => fetchJSON(`${BASE_URL}/stats/summary`),
  getZoneStats: () => fetchJSON(`${BASE_URL}/stats/zones`),
  getFaresDistribution: () => fetchJSON(`${BASE_URL}/stats/fares-distribution`),
  getTimeZoneStats: () => fetchJSON(`${BASE_URL}/stats/time-zones`),
  getCardTypeStats: () => fetchJSON(`${BASE_URL}/stats/card-types`),
  getCompanyStats: () => fetchJSON(`${BASE_URL}/stats/companies`),

  // Lines
  getLines: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJSON(`${BASE_URL}/lines?${q}`);
  },
  getLine: (id) => fetchJSON(`${BASE_URL}/lines/${id}`),

  // Stops
  getStops: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJSON(`${BASE_URL}/stops?${q}`);
  },
  getStopsGeo: () => fetchJSON(`${BASE_URL}/stops/geo/all`),
  getStop: (id) => fetchJSON(`${BASE_URL}/stops/${id}`),

  // Fares
  getFares: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJSON(`${BASE_URL}/fares?${q}`);
  },
  getFareFilters: () => fetchJSON(`${BASE_URL}/fares/filters`),
  getTransfers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJSON(`${BASE_URL}/fares/transfers?${q}`);
  },
  getTransferDiscounts: () => fetchJSON(`${BASE_URL}/fares/transfer-discounts`),
  getBankCommission: () => fetchJSON(`${BASE_URL}/fares/bank-commission`),

  // Companies
  getCompanies: () => fetchJSON(`${BASE_URL}/companies`),
  getCompanyLines: (id) => fetchJSON(`${BASE_URL}/companies/${id}/lines`),
};
