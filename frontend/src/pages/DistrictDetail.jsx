import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from 'recharts';
import { api } from '../services/api';
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Zap, Shield, BookOpen, Lightbulb } from 'lucide-react';

const INDICATOR_LABELS = {
  literacy_rate:         'Literacy Rate (%)',
  sanitation_access:     'Sanitation Access (%)',
  drinking_water_access: 'Drinking Water (%)',
  underweight_children:  'Child Underweight (%)',
  stunted_children:      'Stunted Children (%)',
  anemia_women:          'Anaemia in Women (%)',
  child_marriage_rate:   'Child Marriage (%)',
  anemic_children:       'Anaemia in Children (%)',
};

const CLUSTER_COLOR = {
  'High Poverty':     '#ef4444',
  'Moderate Poverty': '#f59e0b',
  'Low Poverty':      '#22c55e',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card text-sm p-3" style={{ minWidth: 140 }}>
      <p className="font-medium text-white mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.fill || '#f97316' }}>
          {p.name}: <strong>{p.value?.toFixed(1)}%</strong>
        </p>
      ))}
    </div>
  );
};

export default function DistrictDetail() {
  const { name }     = useParams();
  const navigate     = useNavigate();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.getDistrict(name)
      .then(setData)
      .catch(() => setError(`District "${name}" not found or server unavailable.`))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) return (
    <div className="flex items-center justify-center h-72">
      <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );
  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <p style={{ color: '#fca5a5' }}>{error}</p>
      <button onClick={() => navigate(-1)} className="btn-outline mt-4">← Go Back</button>
    </div>
  );

  const indicators = data?.indicators || {};
  const chartData  = Object.entries(INDICATOR_LABELS).map(([key, label]) => ({
    name: label.replace(' (%)', ''),
    value: parseFloat(indicators[key] ?? 0),
  }));

  const radarData = chartData.map(d => ({ subject: d.name.split(' ').slice(0,2).join(' '), A: d.value }));
  const clusterColor = CLUSTER_COLOR[data?.cluster_label] || '#f97316';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back and Actions */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm hover:text-orange-400 transition-colors" style={{ color: '#94a3b8' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-slate-700 hover:border-orange-500 hover:text-orange-500 transition-colors" style={{ color: '#94a3b8' }}>
          Download PDF Report
        </button>
      </div>

      {/* Header */}
      <div className="card mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-header mb-1">{data?.district}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={data?.cluster_label === 'High Poverty' ? 'badge-high' : data?.cluster_label === 'Moderate Poverty' ? 'badge-moderate' : 'badge-low'}>
              {data?.cluster_label}
            </span>
            <span className="text-sm" style={{ color: '#94a3b8' }}>
              MPI Score: <strong style={{ color: clusterColor }}>{data?.mpi_score?.toFixed(1)}</strong>
            </span>
            {data?.is_hotspot === 1 && (
              <span className="flex items-center gap-1 text-xs badge-high">
                <AlertTriangle size={11} /> Poverty Hotspot
              </span>
            )}
            {data?.hotspot_probability !== undefined && (
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Confidence: {data.hotspot_probability}%
              </span>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>Top 3 Poverty Drivers</p>
          {data?.top_drivers?.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: clusterColor }} />
              <span style={{ color: '#f1f5f9' }}>{d.indicator}: <strong style={{ color: clusterColor }}>{d.value}%</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">All Poverty Indicators</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={v => `${v}%`} />
              <YAxis dataKey="name" type="category" width={160} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]}
                fill={clusterColor} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Indicator Radar</h2>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name={data?.district} dataKey="A" stroke={clusterColor} fill={clusterColor} fillOpacity={0.25} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explainable AI Panel */}
      <div className="card mt-6 border-l-4 border-indigo-500">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          Explainable AI (Feature Contributions)
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          This panel shows exactly why the Random Forest ML model assigned this district to its current cluster.
        </p>
        <div className="space-y-4">
          {data?.feature_importances && Object.entries(data.feature_importances)
            .sort(([,a], [,b]) => b - a)
            .map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">{INDICATOR_LABELS[key] || key}</span>
                <span className="text-indigo-400 font-bold">{value}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${value}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Recommendations & Schemes */}
        <div className="card border-l-4 border-orange-500">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb size={18} className="text-orange-500" /> Suggested Development Solutions
          </h2>
          <div className="space-y-3">
            {data?.recommendations?.map((rec, i) => (
              <div key={i} className="flex gap-3 text-sm p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <span className="font-bold text-orange-500">{i+1}.</span>
                <span style={{ color: '#f1f5f9' }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card border-l-4 border-blue-500">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={18} className="text-blue-500" /> Active Government Schemes
          </h2>
          <div className="flex flex-wrap gap-2">
            {data?.schemes?.map((scheme, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {scheme}
              </span>
            ))}
          </div>
          <p className="text-[10px] mt-4 uppercase tracking-wider" style={{ color: '#64748b' }}>
            * Schemes dynamically prioritized based on district drivers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Trend Prediction */}
        <div className="card overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            {data?.poverty_trend_val > 0 ? <TrendingUp size={80} /> : <TrendingDown size={80} />}
          </div>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" /> 3-Year Poverty Projection
          </h2>
          <div className="flex items-center gap-5">
            <div className={`p-5 rounded-2xl flex items-center justify-center ${data?.poverty_trend_val > 0 ? 'bg-emerald-500/10' : (data?.poverty_trend_val < 0 ? 'bg-red-500/10' : 'bg-slate-500/10')}`}>
              {data?.poverty_trend_val > 0 ? (
                <div className="text-center">
                  <span className="text-2xl font-black text-emerald-500 block">↑ {data?.poverty_trend}</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-600/70 italic">Positive Outlook</span>
                </div>
              ) : (data?.poverty_trend_val < 0 ? (
                <div className="text-center">
                  <span className="text-2xl font-black text-red-500 block">↓ {data?.poverty_trend}</span>
                  <span className="text-[10px] uppercase font-bold text-red-600/70 italic">Urgent Intervention</span>
                </div>
              ) : (
                <span className="text-2xl font-black text-slate-500 block">→ Stable</span>
              ))}
            </div>
            <div>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                District show indicators of {data?.poverty_trend?.toLowerCase()} trajectory based on current health and education growth.
              </p>
            </div>
          </div>
        </div>

        {/* Satellite Indicator */}
        <div className="card overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={80} className="text-purple-400" />
          </div>
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap size={18} className="text-purple-400" /> Economic Vitality Index
          </h2>
          <div className="flex items-center gap-5">
            <div className="p-5 rounded-2xl bg-purple-500/10 text-center">
              <span className="text-2xl font-black text-purple-400 block">{data?.night_light_index}%</span>
              <span className="text-[10px] uppercase font-bold text-purple-500/70">Lumintensity</span>
            </div>
            <div>
              <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                Satellite night-light intensity proxy indicating infrastructure and economic distribution across the region.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Indicator cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {Object.entries(INDICATOR_LABELS).map(([key, label]) => {
          const val = parseFloat(indicators[key] ?? 0);
          const isPositive = ['literacy_rate','sanitation_access','drinking_water_access'].includes(key);
          const color = isPositive
            ? (val > 75 ? '#22c55e' : val > 50 ? '#f59e0b' : '#ef4444')
            : (val < 25 ? '#22c55e' : val < 50 ? '#f59e0b' : '#ef4444');
          return (
            <div key={key} className="card text-center">
              <p className="text-xs mb-1" style={{ color: '#64748b' }}>{label.replace(' (%)', '')}</p>
              <p className="text-2xl font-bold" style={{ color }}>{val.toFixed(1)}%</p>
            </div>
          );
        })}
      </div>

      {/* Navigation to map */}
      <div className="mt-6 text-center">
        <Link to="/map" className="btn-outline inline-flex items-center gap-2">
          ← Back to Map
        </Link>
      </div>
    </div>
  );
}
