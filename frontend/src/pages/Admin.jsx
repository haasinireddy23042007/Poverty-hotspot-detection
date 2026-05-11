import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Upload, RefreshCw, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Admin() {
  const navigate = useNavigate();
  const [retraining, setRetraining]   = useState(false);
  const [retainResult, setRetainResult] = useState(null);
  const [districts,  setDistricts]    = useState([]);
  const [loadingDist, setLoadingDist] = useState(false);
  const [editingDist, setEditingDist] = useState(null);
  const [editForm,    setEditForm]    = useState({});
  const [sandboxResult, setSandboxResult] = useState(null);
  const fileRef = useRef(null);

  async function handleSandboxPrediction(formData) {
    try {
      const res = await api.predict(formData);
      setSandboxResult(res);
    } catch (e) {
      console.error('Sandbox prediction failed', e);
    }
  }

  function startEdit(dist) {
    setEditingDist(dist);
    const indicators = dist.indicators || {};
    setEditForm(indicators);
    handleSandboxPrediction(indicators);
  }

  async function handleRetrain() {
    setRetraining(true);
    setRetainResult(null);
    try {
      const res = await api.retrain();
      setRetainResult({ success: true, msg: res.message });
      toast.success('Model retrained successfully!');
    } catch (e) {
      setRetainResult({ success: false, msg: e.response?.data?.message || 'Retrain failed — is the Flask server running?' });
      toast.error('Retrain failed');
    } finally { setRetraining(false); }
  }

  async function loadNGORegistrations() {
    setLoadingDist(true);
    try {
      const res = await api.getDistricts();
      setDistricts(res.districts || []);
    } catch { toast.error('Could not load district data'); }
    finally { setLoadingDist(false); }
  }

  const BADGE = {
    'High Poverty': 'badge-high', 'Moderate Poverty': 'badge-moderate', 'Low Poverty': 'badge-low',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="page-header mb-1">Admin Panel</h1>
      <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-8 flex gap-3">
        <AlertTriangle size={20} className="text-orange-500 shrink-0" />
        <p className="text-sm" style={{ color: '#f1f5f9' }}>
          <strong>Admin Control:</strong> This panel is for system owners. 
          Use the <strong className="text-orange-400">Retrain Model</strong> tool if you've uploaded new dataset files 
          to ensure the ML predictions (Hotspots) are based on the latest statistics. 
          The <strong className="text-orange-400">District Registry</strong> shows the raw data for all regions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* Dataset Upload */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Upload size={18} style={{ color: '#f97316' }} />
            <h2 className="font-semibold text-white">Upload New Dataset</h2>
          </div>
          <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
            Upload a new CSV file to replace the current NFHS-5 dataset. The model will retrain automatically.
          </p>
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-orange-400"
            style={{ borderColor: 'rgba(249,115,22,0.3)' }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); toast('Dataset upload coming soon — place CSV in /data folder and retrain.'); }}>
            <Upload size={32} className="mx-auto mb-3" style={{ color: '#f97316', opacity: 0.6 }} />
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Drag & drop a CSV file here, or <span style={{ color: '#f97316' }}>browse</span>
            </p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>Place file in <code style={{ color: '#f97316' }}>/data/</code> folder to use</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={() => toast('Place the CSV in /data/ and click "Retrain Model" below.')} />
          </div>
        </div>

        {/* Model Retrain */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw size={18} style={{ color: '#f97316' }} />
            <h2 className="font-semibold text-white">Retrain ML Model</h2>
          </div>
          <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
            Re-run the K-Means clustering + Random Forest classifier on the current dataset.
            Takes ~5 seconds.
          </p>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: '#64748b' }}>
              <div className="card py-2 text-center">Algorithm: <strong className="text-white">K-Means (k=3)</strong></div>
              <div className="card py-2 text-center">Classifier: <strong className="text-white">Random Forest</strong></div>
              <div className="card py-2 text-center">Features: <strong className="text-white">8 indicators</strong></div>
              <div className="card py-2 text-center">Source: <strong className="text-white">NFHS-5</strong></div>
            </div>
            <button onClick={handleRetrain} disabled={retraining}
              className="btn-primary flex items-center justify-center gap-2 py-3">
              {retraining
                ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Retraining…</>
                : <><RefreshCw size={16} /> Retrain Model</>}
            </button>
            {retainResult && (
              <div className={`flex items-center gap-2 text-sm p-3 rounded-lg ${retainResult.success ? '' : ''}`}
                style={{ background: retainResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                         color: retainResult.success ? '#86efac' : '#fca5a5' }}>
                {retainResult.success ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                {retainResult.msg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* District + NGO registry */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} style={{ color: '#f97316' }} />
            <h2 className="font-semibold text-white">District Data Registry</h2>
          </div>
          <button onClick={loadNGORegistrations} disabled={loadingDist} className="btn-outline text-sm py-1.5 px-4 flex items-center gap-1.5">
            {loadingDist ? <span className="animate-spin w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full" /> : <RefreshCw size={13} />}
            Load Data
          </button>
        </div>

        {districts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(249,115,22,0.15)' }}>
                  {['District','MPI Score','Cluster','Is Hotspot','Literacy','Sanitation','Water'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 font-medium" style={{ color: '#94a3b8' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {districts.sort((a,b) => b.mpi_score - a.mpi_score).map(d => (
                  <tr 
                    key={d.district} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-2.5 pr-4 font-medium text-white cursor-pointer hover:text-orange-400"
                        onClick={() => navigate(`/district/${d.district}`)}>
                      {d.district}
                    </td>
                    <td className="py-2.5 pr-4" style={{ color: '#f97316' }}>{d.mpi_score.toFixed(1)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={BADGE[d.cluster_label] || 'badge-moderate'}>{d.cluster_label}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      {d.is_hotspot ? <span className="badge-high">Yes</span> : <span className="badge-low">No</span>}
                    </td>
                    <td className="py-2.5 pr-4" style={{ color: '#94a3b8' }}>{d.indicators?.literacy_rate?.toFixed(1)}%</td>
                    <td className="py-2.5 pr-4" style={{ color: '#94a3b8' }}>{d.indicators?.sanitation_access?.toFixed(1)}%</td>
                    <td className="py-2.5 pr-4">
                      <button onClick={(e) => { e.stopPropagation(); startEdit(d); }} 
                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-orange-500 transition-colors text-orange-500">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8" style={{ color: '#64748b' }}>
            Click "Load Data" to view all district registrations.
          </p>
        )}
      </div>

      {/* Manual Edit Modal / Simulation Sandbox */}
      {editingDist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card w-full max-w-xl shadow-2xl animate-in zoom-in duration-200 border-orange-500/30">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Simulation Sandbox</h2>
                <p className="text-sm" style={{ color: '#94a3b8' }}>
                  Adjusting <strong className="text-white">{editingDist.district}</strong> to test policy impacts
                </p>
              </div>
              <button onClick={() => setEditingDist(null)} className="text-slate-500 hover:text-white p-1">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Sliders */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-3 custom-scrollbar">
                {Object.entries(editForm).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: '#64748b' }}>
                        {key.replace(/_/g, ' ')}
                      </label>
                      <span className="text-xs font-mono text-orange-400 font-bold">{value.toFixed(1)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min={0} max={100} step={0.1} 
                      value={value} 
                      onChange={e => {
                        const newVal = parseFloat(e.target.value);
                        setEditForm(prev => {
                          const updated = { ...prev, [key]: newVal };
                          // Debounced or immediate prediction? Let's try immediate.
                          return updated;
                        });
                        // Trigger prediction
                        handleSandboxPrediction({ ...editForm, [key]: newVal });
                      }}
                      className="w-full accent-orange-500 bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer" 
                    />
                  </div>
                ))}
              </div>

              {/* Real-time Result */}
              <div className="flex flex-col">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-6">Live Prediction</span>
                  
                  {sandboxResult ? (
                    <>
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 border-4 shadow-2xl transition-all duration-500 ${
                        sandboxResult.cluster_label === 'High Poverty' ? 'bg-red-500/20 border-red-500 shadow-red-500/20' :
                        sandboxResult.cluster_label === 'Moderate Poverty' ? 'bg-orange-500/20 border-orange-500 shadow-orange-500/20' :
                        'bg-emerald-500/20 border-emerald-500 shadow-emerald-500/20'
                      }`}>
                        <AlertTriangle size={40} className={
                          sandboxResult.cluster_label === 'High Poverty' ? 'text-red-500' :
                          sandboxResult.cluster_label === 'Moderate Poverty' ? 'text-orange-500' :
                          'text-emerald-500'
                        } />
                      </div>
                      
                      <h3 className={`text-2xl font-black mb-1 transition-colors duration-500 ${
                        sandboxResult.cluster_label === 'High Poverty' ? 'text-red-500' :
                        sandboxResult.cluster_label === 'Moderate Poverty' ? 'text-orange-500' :
                        'text-emerald-500'
                      }`}>
                        {sandboxResult.cluster_label}
                      </h3>
                      
                      <p className="text-xs text-slate-400 mb-4">
                        Status: <span className="text-white font-bold">{sandboxResult.is_hotspot ? 'CRITICAL HOTSPOT' : 'SAFE ZONE'}</span>
                      </p>

                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-orange-500 transition-all duration-500" 
                             style={{ width: `${sandboxResult.probability * 100}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 font-mono">HOTSPOT PROBABILITY: {(sandboxResult.probability * 100).toFixed(1)}%</p>
                    </>
                  ) : (
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/10 rounded-full mb-4" />
                      <div className="h-4 w-24 bg-white/10 rounded mb-2" />
                      <div className="h-3 w-32 bg-white/10 rounded" />
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-[10px] leading-relaxed text-blue-200">
                    <strong className="text-blue-400 italic">Policy Insight:</strong> If you increase literacy to 80%, notice how the hotspot status shifts to Moderate/Low in real-time.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setEditingDist(null)} className="flex-1 btn-outline py-2.5">Close Sandbox</button>
              <button onClick={() => { toast.success('Data update mocked successfully!'); setEditingDist(null); }} className="flex-1 btn-primary py-2.5">Apply to Registry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
