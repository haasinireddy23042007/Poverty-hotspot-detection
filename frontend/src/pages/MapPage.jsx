import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { Search, X } from 'lucide-react';

// ── Colour helpers ────────────────────────────────────────────────────────────
function clusterColor(label) {
  if (label === 'High Poverty')     return '#ef4444';
  if (label === 'Moderate Poverty') return '#f59e0b';
  return '#22c55e';
}

// ── Map fit-bounds on data load ───────────────────────────────────────────────
function FitBounds({ geoJson }) {
  const map = useMap();
  useEffect(() => {
    if (!geoJson) return;
    try { map.fitBounds(L.geoJSON(geoJson).getBounds(), { padding: [20, 20] }); } catch (_) {}
  }, [geoJson, map]);
  return null;
}

// ── Legend component ──────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="card absolute bottom-4 left-4 z-[1000] p-3 text-sm" style={{ minWidth: 160 }}>
      <p className="font-semibold mb-2 text-white">Poverty Level</p>
      {[['#ef4444','High Poverty'],['#f59e0b','Moderate Poverty'],['#22c55e','Low Poverty']].map(([c,l]) => (
        <div key={l} className="flex items-center gap-2 mb-1">
          <span className="w-4 h-4 rounded" style={{ background: c, opacity: 0.8 }} />
          <span style={{ color: '#94a3b8' }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

export default function MapPage() {
  const navigate = useNavigate();
  const [geoJson,   setGeoJson]   = useState(null);
  const [districts, setDistricts] = useState([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const mapRef = useRef(null);

  // Load GeoJSON boundary + API data
  useEffect(() => {
    const fetchGeo = fetch(
      'https://raw.githubusercontent.com/datameet/maps/master/Districts/Telangana.geojson'
    ).then(r => r.ok ? r.json() : null).catch(() => null);

    const fetchDistricts = api.getDistricts().catch(() => ({ districts: [] }));

    Promise.all([fetchGeo, fetchDistricts]).then(([geo, distData]) => {
      setGeoJson(geo);
      setDistricts(distData.districts || []);
    }).catch(() => setError('Failed to load map data.')).finally(() => setLoading(false));
  }, []);

  // Build district lookup map
  const districtMap = {};
  districts.forEach(d => {
    districtMap[d.district.toLowerCase()] = d;
  });

  function getDistrictData(feature) {
    const name = (feature.properties?.DISTRICT || feature.properties?.district || '').toLowerCase().trim();
    
    // 1. Exact match
    if (districtMap[name]) return districtMap[name];
    
    // 2. Mapping common GeoJSON name variations to API names
    const ALIASES = {
      'rangareddy': 'rangareddi',
      'mahabubnagar': 'mahbubnagar',
      'yadadri': 'yadadri bhuvanagiri',
      'bhadradri': 'bhadradri kothagudem',
      'komaram bheem': 'kumuram bheem asifabad',
      'asifabad': 'kumuram bheem asifabad',
      'gadwal': 'jogulamba gadwal',
      'bhupalpally': 'jayashankar bhupalapally',
      'kothagudem': 'bhadradri kothagudem'
    };
    
    for (const [alias, real] of Object.entries(ALIASES)) {
      if (name.includes(alias)) return districtMap[real];
    }

    // 3. Partial match
    const keys = Object.keys(districtMap);
    const match = keys.find(k => 
      name.includes(k.split(' ')[0]) || 
      k.includes(name.split(' ')[0])
    );
    return match ? districtMap[match] : null;
  }

  function styleFeature(feature) {
    const data  = getDistrictData(feature);
    const color = data ? clusterColor(data.cluster_label) : '#475569';
    return { 
      fillColor: color, 
      weight: data ? 1.5 : 0.5, 
      color: '#1e293b', 
      fillOpacity: data ? 0.75 : 0.3 
    };
  }

  function onEachFeature(feature, layer) {
    const data = getDistrictData(feature);
    const name = feature.properties?.DISTRICT || feature.properties?.district || 'Unknown';

    layer.on({
      mouseover(e) {
        e.target.setStyle({ weight: 3, fillOpacity: 0.9 });
      },
      mouseout(e) {
        e.target.setStyle(styleFeature(feature));
      },
      click() {
        navigate(`/district/${data?.district || name}`);
      },
    });

    const driverHtml = data?.top_drivers?.map(d => `<li>${d.indicator}: <strong>${d.value}%</strong></li>`).join('') || '';
    layer.bindPopup(`
      <div style="font-family: Inter, sans-serif; min-width: 200px">
        <h3 style="margin:0 0 8px;font-size:15px;font-weight:700;color:#f1f5f9">${name}</h3>
        ${data ? `
          <p style="margin:4px 0;color:#94a3b8;font-size:12px">MPI Score: <strong style="color:#f97316">${data.mpi_score?.toFixed(1)}</strong></p>
          <p style="margin:4px 0;font-size:12px"><span style="background:${clusterColor(data.cluster_label)}33;color:${clusterColor(data.cluster_label)};padding:2px 8px;border-radius:999px">${data.cluster_label}</span></p>
          <p style="margin:8px 0 4px;font-size:11px;color:#94a3b8;font-weight:600">TOP POVERTY DRIVERS:</p>
          <ul style="margin:0;padding-left:16px;font-size:12px;color:#cbd5e1">${driverHtml}</ul>
          <p style="margin-top:8px;font-size:11px;color:#f97316;cursor:pointer">Click for full details →</p>
        ` : `<p style="color:#94a3b8">Data not available</p>`}
      </div>
    `);
  }

  const filtered = districts.filter(d => d.district.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-header">Telangana Poverty Map</h1>
          <p style={{ color: '#94a3b8' }}>Click any district to view detailed indicators</p>
        </div>
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }} />
          <input className="input-field pl-9 pr-9" placeholder="Search district…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }}>
              <X size={14} />
            </button>
          )}
          {search && filtered.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 card py-1 z-50 max-h-48 overflow-y-auto shadow-xl">
              {filtered.map(d => (
                <button key={d.district} onClick={() => { navigate(`/district/${d.district}`); setSearch(''); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-white/10 flex items-center justify-between">
                  <span style={{ color: '#f1f5f9' }}>{d.district}</span>
                  <span className={d.cluster_label === 'High Poverty' ? 'badge-high' : d.cluster_label === 'Moderate Poverty' ? 'badge-moderate' : 'badge-low'}
                    style={{ fontSize: '0.65rem' }}>{d.cluster_label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <div className="card mb-4" style={{ color: '#fca5a5' }}>{error}</div>}

      {/* Map Container */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: '65vh', border: '1px solid rgba(249,115,22,0.2)' }}>
        <MapContainer
          center={[17.9, 79.4]} zoom={7} style={{ height: '100%', width: '100%' }}
          ref={mapRef} zoomControl={true}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          {geoJson && (
            <>
              <GeoJSON data={geoJson} style={styleFeature} onEachFeature={onEachFeature} key={districts.length} />
              <FitBounds geoJson={geoJson} />
            </>
          )}
        </MapContainer>
        <Legend />
      </div>

      {/* District chips below map */}
      <div className="mt-6 flex flex-wrap gap-2">
        {districts.sort((a,b) => b.mpi_score - a.mpi_score).map(d => (
          <button key={d.district} onClick={() => navigate(`/district/${d.district}`)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 border"
            style={{
              background: `${clusterColor(d.cluster_label)}22`,
              color: clusterColor(d.cluster_label),
              borderColor: `${clusterColor(d.cluster_label)}44`,
            }}>
            {d.district}
          </button>
        ))}
      </div>
    </div>
  );
}
