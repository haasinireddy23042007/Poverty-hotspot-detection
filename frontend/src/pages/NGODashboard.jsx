import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { supabase } from '../config/supabase';
import { Bell, Settings, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NGODashboard() {
  const { currentUser, ngoProfile, setNgoProfile } = useAuth();
  const navigate = useNavigate();

  const [districts,  setDistricts]  = useState([]);
  const [threshold,  setThreshold]  = useState(ngoProfile?.alert_threshold ?? 70);
  const [saving,     setSaving]     = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    api.getDistricts()
      .then(d => setDistricts(d.districts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const monitoredDistricts = districts.filter(d =>
    (ngoProfile?.monitored_districts || []).includes(d.district)
  );
  const hotAlerts = monitoredDistricts.filter(d => d.mpi_score >= threshold);

  async function saveThreshold() {
    if (!currentUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ngos')
        .update({ alert_threshold: threshold })
        .eq('uid', currentUser.id);

      if (error) throw error;

      setNgoProfile(p => ({ ...p, alert_threshold: threshold }));
      toast.success('Alert threshold saved to Supabase!');
    } catch (err) { 
      console.error('Save error:', err);
      toast.error('Failed to save settings.'); 
    } finally { 
      setSaving(false); 
    }
  }

  async function triggerAlert(district) {
    setTriggering(true);
    const email = ngoProfile?.email || currentUser?.email;
    
    const driversList = (district.top_drivers || []).map(d => `<li>${d.indicator}: ${d.value}%</li>`).join('');
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ef4444;">Poverty Hotspot Alert: ${district.district}</h2>
        <p>This district has exceeded your alert threshold of <strong>${threshold}%</strong>.</p>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Current MPI Score:</strong> ${district.mpi_score.toFixed(1)}</p>
          <p style="margin: 5px 0 0 0;"><strong>Status:</strong> High Poverty Zone</p>
        </div>
        <h3>Primary Poverty Drivers:</h3>
        <ul>${driversList}</ul>
        <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
          Action Required: Mobilise field teams and coordinate with local administration.
        </p>
      </div>
    `;

    try {
      await api.sendAlert({
        email: email,
        subject: `⚠️ HOTSPOT ALERT: ${district.district}`,
        html: html
      });
      toast.success(`Alert email dispatched to ${email}`);
      
      // Update history in Supabase
      const newHistory = [
        { district: district.district, date: new Date().toLocaleString() },
        ...(ngoProfile?.notification_history || [])
      ].slice(0, 10);
      
      await supabase
        .from('ngos')
        .update({ notification_history: newHistory })
        .eq('uid', currentUser.id);
        
      setNgoProfile(p => ({ ...p, notification_history: newHistory }));
    } catch (err) {
      toast.error('Failed to send alert via Resend.');
      console.error(err);
    } finally {
      setTriggering(false);
    }
  }

  function clusterColor(label) {
    if (label === 'High Poverty')     return '#ef4444';
    if (label === 'Moderate Poverty') return '#f59e0b';
    return '#22c55e';
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="page-header mb-1">{ngoProfile?.ngo_name || 'NGO Dashboard'}</h1>
      <p className="mb-8" style={{ color: '#94a3b8' }}>
        {ngoProfile?.district && `Primary District: ${ngoProfile.district}`}
        {ngoProfile?.registration_no && ` · Reg: ${ngoProfile.registration_no}`}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: alerts panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Active alerts */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} style={{ color: '#f87171' }} />
              <h2 className="font-semibold text-white">Active Alerts</h2>
              {hotAlerts.length > 0 && (
                <span className="badge-high">{hotAlerts.length}</span>
              )}
            </div>

            {loading && <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />}

            {!loading && hotAlerts.length === 0 && (
              <div className="flex items-center gap-2 py-4" style={{ color: '#22c55e' }}>
                <CheckCircle size={16} /> No districts above your threshold of {threshold}%
              </div>
            )}

            {hotAlerts.map(d => (
              <div key={d.district} className="flex items-start justify-between py-3 border-b border-white/5 last:border-none">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{d.district}</span>
                    <span className="badge-high text-xs">{d.mpi_score.toFixed(1)} MPI</span>
                  </div>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>
                    Top driver: {d.top_drivers?.[0]?.indicator} ({d.top_drivers?.[0]?.value}%)
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button onClick={() => triggerAlert(d)} disabled={triggering}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                    <Bell size={12} /> Send Alert Email
                  </button>
                  <p className="text-[9px]" style={{ color: '#64748b' }}>Dispatch report to your team</p>
                </div>
              </div>
            ))}
          </div>

          {/* Monitored districts */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={18} style={{ color: '#f97316' }} />
              <h2 className="font-semibold text-white">Monitored Districts</h2>
            </div>

            {loading ? (
              <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
            ) : (
              <div className="flex flex-wrap gap-3">
                {monitoredDistricts.map(d => (
                  <button key={d.district} onClick={() => navigate(`/district/${d.district}`)}
                    className="card flex-shrink-0 text-sm px-4 py-3 cursor-pointer text-left hover:scale-105 transition-transform"
                    style={{ minWidth: 160, background: `${clusterColor(d.cluster_label)}11`, borderColor: `${clusterColor(d.cluster_label)}40` }}>
                    <p className="font-medium mb-1" style={{ color: clusterColor(d.cluster_label) }}>{d.district}</p>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>MPI: {d.mpi_score.toFixed(1)} · {d.cluster_label}</p>
                  </button>
                ))}
                {monitoredDistricts.length === 0 && (
                  <p style={{ color: '#64748b' }}>No districts monitored yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Notification history */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} style={{ color: '#94a3b8' }} />
              <h2 className="font-semibold text-white">Notification History</h2>
            </div>
            {(ngoProfile?.notification_history || []).length === 0 ? (
              <p style={{ color: '#64748b' }}>No notifications sent yet.</p>
            ) : (
              ngoProfile.notification_history.map((n, i) => (
                <div key={i} className="py-2 border-b border-white/5 text-sm">
                  <span style={{ color: '#f1f5f9' }}>{n.district}</span>
                  <span className="mx-2" style={{ color: '#64748b' }}>·</span>
                  <span style={{ color: '#94a3b8' }}>{n.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: settings */}
        <div className="flex flex-col gap-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={18} style={{ color: '#f97316' }} />
              <h2 className="font-semibold text-white">Alert Settings</h2>
            </div>

            <label className="block text-sm mb-1.5" style={{ color: '#94a3b8' }}>
              Alert Threshold (MPI Score)
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min={20} max={100} step={5} value={threshold}
                onChange={e => setThreshold(parseInt(e.target.value))}
                className="flex-1 accent-orange-500" />
              <span className="w-12 text-center font-bold" style={{ color: '#f97316' }}>{threshold}</span>
            </div>
            <p className="text-xs mt-2 mb-4" style={{ color: '#64748b' }}>
              You'll receive alerts for districts with MPI score ≥ {threshold}
            </p>
            <button onClick={saveThreshold} disabled={saving} className="btn-primary w-full py-2 text-sm">
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>

          <div className="card">
            <h2 className="font-semibold text-white mb-3">NGO Profile</h2>
            {[
              ['Name',    ngoProfile?.ngo_name],
              ['Email',   ngoProfile?.email || currentUser?.email],
              ['Reg No.', ngoProfile?.registration_no],
              ['District',ngoProfile?.district],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-none">
                <span style={{ color: '#94a3b8' }}>{label}</span>
                <span style={{ color: '#f1f5f9' }}>{val || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
