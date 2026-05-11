import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { AlertTriangle, MapPin, Users, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const BADGE = {
  'High Poverty':     'badge-high',
  'Moderate Poverty': 'badge-moderate',
  'Low Poverty':      'badge-low',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Home() {
  const { ngoProfile } = useAuth();
  const [stats, setStats]       = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([api.getStats(), api.getHotspots()])
      .then(([s, h]) => { setStats(s); setHotspots(h.hotspots || []); })
      .catch(() => setError('Could not reach the ML backend. Start the Flask server on port 5000.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-72">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" 
      />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Greeting */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <h1 className="page-header text-4xl font-black">
          {ngoProfile ? `Welcome, ${ngoProfile.ngoName} 👋` : 'Dashboard Overview'}
        </h1>
        <p className="text-slate-400 font-medium mt-1">
          {ngoProfile?.district
            ? `Monitoring: ${ngoProfile.district} · Alert threshold: ${ngoProfile.alertThreshold ?? 70}`
            : 'Real-time poverty monitoring across Telangana districts'}
        </p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card mb-6 p-4 flex items-center gap-3 border-red-500/20 bg-red-500/5"
        >
          <AlertTriangle size={18} className="text-red-400" />
          <p className="text-red-200 text-sm font-medium">{error}</p>
        </motion.div>
      )}

      {/* Stats Grid */}
      {stats && (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={item}><StatCard title="Total Districts" value={stats.total_districts}    color="#60a5fa" Icon={MapPin} /></motion.div>
          <motion.div variants={item}><StatCard title="Hotspot Districts" value={stats.hotspot_districts}  color="#f87171" subtitle="High Poverty" Icon={AlertTriangle} /></motion.div>
          <motion.div variants={item}><StatCard title="Moderate Poverty" value={stats.moderate_districts} color="#fbbf24" Icon={Activity} /></motion.div>
          <motion.div variants={item}><StatCard title="Avg MPI Score" value={stats.avg_mpi_score?.toFixed(1)+'%'} color="#f97316" Icon={TrendingUp} /></motion.div>
        </motion.div>
      )}

      {/* Summary cards */}
      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <div className="glass-card p-6 border-white/5">
            <p className="text-xs uppercase tracking-widest font-bold mb-2 text-slate-500">Most Impoverished District</p>
            <p className="text-2xl font-black text-white">{stats.highest_mpi_district}</p>
            <span className="badge-high mt-3 inline-block">High Poverty Priority</span>
          </div>
          <div className="glass-card p-6 border-white/5">
            <p className="text-xs uppercase tracking-widest font-bold mb-2 text-slate-500">Best Performing District</p>
            <p className="text-2xl font-black text-white">{stats.lowest_mpi_district}</p>
            <span className="badge-low mt-3 inline-block">Low Poverty Baseline</span>
          </div>
        </motion.div>
      )}

      {/* Hotspot Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-lg text-white flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            High Poverty Districts ({hotspots.length})
          </h2>
          <Link to="/map" className="flex items-center gap-1 text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors">
            Interactive Map <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5">
                {['District','MPI Score','Cluster','Top Driver'].map(h => (
                  <th key={h} className="text-left py-3 px-6 font-bold uppercase tracking-wider text-slate-500 text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <motion.tbody 
              variants={container}
              initial="hidden"
              animate="show"
            >
              {hotspots.map(d => (
                <motion.tr 
                  key={d.district} 
                  variants={item}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  onClick={() => window.location.href = `/district/${d.district}`}
                >
                  <td className="py-4 px-6 font-bold text-white">{d.district}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${d.mpi_score}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <span className="font-bold text-red-400">{d.mpi_score.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6"><span className={BADGE[d.cluster_label] || 'badge-moderate'}>{d.cluster_label}</span></td>
                  <td className="py-4 px-6 text-slate-400 font-medium">{d.top_drivers?.[0]?.indicator || '—'}</td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
          {!hotspots.length && !error && (
            <div className="text-center py-20">
              <Activity size={48} className="mx-auto text-slate-700 mb-4" />
              <p className="text-slate-500 font-semibold text-lg">No high-poverty regions detected.</p>
              <p className="text-slate-600 text-sm">Districts with MPI scores above critical thresholds appear here.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
