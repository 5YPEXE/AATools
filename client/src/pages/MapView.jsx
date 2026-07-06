import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline } from 'react-leaflet';
import { Search, Layers, Info } from 'lucide-react';
import { useLang } from '../App';
import { t } from '../i18n';
import { api } from '../lib/api';
import { formatLineId } from '../lib/formatLineId';

// Dark tile layer URL
const DARK_TILE = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

function getMarkerColor(lineCount) {
  if (lineCount >= 10) return '#ff6b6b';
  if (lineCount >= 5)  return '#f5a623';
  if (lineCount >= 2)  return '#4f7cff';
  return '#00d4aa';
}

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14, { animate: true });
  }, [center, map]);
  return null;
}

export default function MapView() {
  const { lang } = useLang();
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStop, setSelectedStop] = useState(null);
  const [lineRoute, setLineRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [stats, setStats] = useState({ total: 0, shown: 0 });

  useEffect(() => {
    api.getStopsGeo().then(data => {
      setStops(data);
      setStats({ total: data.length, shown: data.length });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredStops = useCallback(() => {
    if (!searchQuery) return stops;
    const q = searchQuery.toLowerCase();
    return stops.filter(s => s.name.toLowerCase().includes(q) || String(s.id).includes(q));
  }, [stops, searchQuery]);

  const displayed = filteredStops();

  const handleStopClick = async (stop) => {
    setSelectedStop(stop);
    setMapCenter([stop.lat, stop.lon]);
  };

  const handleShowLine = async (lineId) => {
    try {
      const lineData = await api.getLine(lineId);
      const dir0 = lineData.stops.filter(s => s.direction === 0).sort((a, b) => a.position - b.position);
      const dir1 = lineData.stops.filter(s => s.direction === 1).sort((a, b) => a.position - b.position);
      const toLatLon = (s) => [s.lat_deg + s.lat_min / 600000, s.long_deg + s.long_min / 600000];
      setLineRoute({
        name: lineData.name,
        path0: dir0.map(toLatLon).filter(ll => ll[0] > 0),
        path1: dir1.map(toLatLon).filter(ll => ll[0] > 0),
      });
    } catch {}
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t(lang, 'map')}</h1>
        <p>{t(lang, 'totalStops')}: {stats.total.toLocaleString('tr-TR')} — {t(lang, 'showingOf')}: {displayed.length.toLocaleString('tr-TR')}</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="search-input"
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder={t(lang, 'search')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {lineRoute && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--accent-glow)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
            <Layers size={14} />
            <span style={{ color: 'var(--text-accent)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lineRoute.name}</span>
            <button onClick={() => setLineRoute(null)} style={{ background: 'none', border: 'none', color: 'var(--accent3)', cursor: 'pointer', padding: '0 2px', fontSize: 16 }}>×</button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
        {[
          { color: '#00d4aa', label: '1 hat' },
          { color: '#4f7cff', label: '2–4 hat' },
          { color: '#f5a623', label: '5–9 hat' },
          { color: '#ff6b6b', label: '10+ hat' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="map-container">
        {loading ? (
          <div className="loading-state" style={{ height: '100%' }}>
            <div className="spinner" />
            <span>{t(lang, 'loading')}</span>
          </div>
        ) : (
          <MapContainer
            center={[39.92, 32.85]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            preferCanvas={true}
          >
            <TileLayer url={DARK_TILE} attribution={TILE_ATTR} />
            {mapCenter && <MapController center={mapCenter} />}

            {/* Line route overlay */}
            {lineRoute?.path0?.length > 1 && (
              <Polyline positions={lineRoute.path0} color="#4f7cff" weight={3} opacity={0.85} />
            )}
            {lineRoute?.path1?.length > 1 && (
              <Polyline positions={lineRoute.path1} color="#00d4aa" weight={2.5} opacity={0.75} dashArray="6 4" />
            )}

            {/* Stops */}
            {displayed.map(stop => (
              <CircleMarker
                key={stop.id}
                center={[stop.lat, stop.lon]}
                radius={stop.lineCount >= 5 ? 6 : 4}
                pathOptions={{
                  color: getMarkerColor(stop.lineCount),
                  fillColor: getMarkerColor(stop.lineCount),
                  fillOpacity: 0.85,
                  weight: 1,
                  opacity: 0.9,
                }}
                eventHandlers={{
                  click: () => handleStopClick(stop),
                }}
              >
                <Popup>
                  <div style={{ minWidth: 200, fontFamily: 'Inter, sans-serif' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#1a1a2e' }}>{stop.name}</div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                      ID: {stop.id} · {stop.lineCount} hat · {stop.lat.toFixed(5)}, {stop.lon.toFixed(5)}
                    </div>
                    <StopLinesList stopId={stop.id} onShowLine={handleShowLine} />
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

function StopLinesList({ stopId, onShowLine }) {
  const [lines, setLines] = useState(null);

  useEffect(() => {
    api.getStop(stopId).then(d => setLines(d.lines)).catch(() => setLines([]));
  }, [stopId]);

  if (!lines) return <div style={{ fontSize: 12, color: '#999' }}>Yükleniyor...</div>;

  return (
    <div style={{ maxHeight: 160, overflowY: 'auto' }}>
      {lines.slice(0, 10).map(l => (
        <div
          key={`${l.line_id}-${l.direction}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 0', borderBottom: '1px solid #f0f0f0', fontSize: 12, cursor: 'pointer',
            gap: 8
          }}
          onClick={() => onShowLine(l.line_id)}
        >
          <span style={{ fontWeight: 600, color: '#4f7cff', minWidth: 40 }}>#{formatLineId(l.line_id)}</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333', fontSize: 11 }}>{l.name}</span>
          <span style={{ fontSize: 10, padding: '1px 6px', background: l.direction === 0 ? '#e8f4ff' : '#e8fff8', borderRadius: 99, color: l.direction === 0 ? '#4f7cff' : '#00d4aa', flexShrink: 0 }}>
            {l.direction === 0 ? '→' : '←'}
          </span>
        </div>
      ))}
      {lines.length > 10 && <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>+{lines.length - 10} daha...</div>}
    </div>
  );
}
