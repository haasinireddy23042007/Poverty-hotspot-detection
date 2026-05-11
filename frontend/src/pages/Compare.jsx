import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowLeft, GitCompare } from 'lucide-react';

const INDICATOR_LABELS = {
  literacy_rate:         'Literacy',
  sanitation_access:     'Sanitation',
  drinking_water_access: 'Water',
  underweight_children:  'Underweight',
  stunted_children:      'Stunted',
  anemia_women:          'Women Anemia',
  child_marriage_rate:   'Child Marriage',
  anemic_children:       'Child Anemia',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card text-sm p-3" style={{ minWidth: 140 }}>
      <p className="font-medium text-white mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toFixed(1)}%</strong>
        </p>
      ))}
    </div>
  );
};

export default function Compare() {
  const [districts, setDistricts] = useState([]);
  const [d1, setD1] = useState(null);
  const [d2, setD2] = useState(null);

  useEffect(() => {
    api.getDistricts().then(res => {
      const sorted = res.districts.sort((a,b) => a.district.localeCompare(b.district));
      setDistricts(sorted);
      if (sorted.length >= 2) {
        setD1(sorted[0]);
        setD2(sorted[1]);
      }
    });
  }, []);

  const handleSelect1 = (e) => {
    const d = districts.find(x => x.district === e.target.value);
    setD1(d);
  };

  const handleSelect2 = (e) => {
    const d = districts.find(x => x.district === e.target.value);
    setD2(d);
  };

  const chartData = Object.keys(INDICATOR_LABELS).map(key => ({
    subject: INDICATOR_LABELS[key],
    A: d1 ? parseFloat(d1.indicators[key] || 0) : 0,
    B: d2 ? parseFloat(d2.indicators[key] || 0) : 0,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <GitCompare size={28} className="text-orange-500" />
        <h1 className="page-header m-0">District Comparison Tool</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card border-t-4 border-emerald-500">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-wider block mb-2">District 1</label>
          <select value={d1?.district || ''} onChange={handleSelect1} className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 outline-none focus:border-emerald-500">
            {districts.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
          </select>
          {d1 && (
            <div className="mt-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <p className="text-xl font-bold text-white mb-1">{d1.district}</p>
              <p className="text-sm text-emerald-400 font-medium">MPI: {d1.mpi_score.toFixed(1)} • {d1.cluster_label}</p>
              {d1.hotspot_probability !== undefined && (
                <p className="text-xs text-slate-400 mt-2">Hotspot Risk: {d1.hotspot_probability}%</p>
              )}
            </div>
          )}
        </div>

        <div className="card border-t-4 border-blue-500">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-wider block mb-2">District 2</label>
          <select value={d2?.district || ''} onChange={handleSelect2} className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 outline-none focus:border-blue-500">
            {districts.map(d => <option key={d.district} value={d.district}>{d.district}</option>)}
          </select>
          {d2 && (
            <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-xl font-bold text-white mb-1">{d2.district}</p>
              <p className="text-sm text-blue-400 font-medium">MPI: {d2.mpi_score.toFixed(1)} • {d2.cluster_label}</p>
              {d2.hotspot_probability !== undefined && (
                <p className="text-xs text-slate-400 mt-2">Hotspot Risk: {d2.hotspot_probability}%</p>
              )}
            </div>
          )}
        </div>
      </div>

      {(d1 && d2) && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-6 text-center">Indicators Overlay</h2>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Radar name={d1.district} dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Radar name={d2.district} dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 20 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
