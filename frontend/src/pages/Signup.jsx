import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const TG_DISTRICTS = [
  'Adilabad','Bhadradri Kothagudem','Hyderabad','Jagitial','Jangoan',
  'Jayashankar Bhupalapally','Jogulamba Gadwal','Kamareddy','Karimnagar',
  'Khammam','Kumuram Bheem','Mahabubabad','Mahbubnagar','Mancherial',
  'Medak','Medchal-Malkajgiri','Mulugu','Nagarkurnool','Nalgonda',
  'Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla',
  'Ranga Reddy','Sangareddy','Siddipet','Suryapet','Vikarabad',
  'Wanaparthy','Warangal Rural','Warangal Urban','Yadadri Bhuvanagiri',
];

export default function Signup() {
  const { signup } = useAuth();
  const navigate    = useNavigate();
  const [form, setForm] = useState({
    ngoName: '', email: '', password: '', confirmPassword: '',
    registrationNo: '', district: '',
  });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await signup(form);
      toast.success('Registration successful! Welcome aboard 🎉');
      navigate('/home');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 hero-gradient">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'linear-gradient(135deg,#f97316,#c2410c)' }}>
            <AlertTriangle size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Register Your NGO</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Join the poverty monitoring network for Telangana</p>
        </div>

        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>NGO Name *</label>
              <input className="input-field" required placeholder="Helping Hands Foundation"
                value={form.ngoName} onChange={e => update('ngoName', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Registration Number *</label>
              <input className="input-field" required placeholder="TG/NGO/2023/001"
                value={form.registrationNo} onChange={e => update('registrationNo', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>District of Operation *</label>
            <select className="input-field" required value={form.district} onChange={e => update('district', e.target.value)}>
              <option value="">Select district…</option>
              {TG_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Email Address *</label>
            <input className="input-field" type="email" required placeholder="haasinireddy2304@gmail.com"
              value={form.email} onChange={e => update('email', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Password *</label>
              <div className="relative">
                <input className="input-field pr-10" type={showPw ? 'text' : 'password'} required placeholder="Min. 6 chars"
                  value={form.password} onChange={e => update('password', e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Confirm Password *</label>
              <input className="input-field" type="password" required placeholder="Re-enter password"
                value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 w-full py-3 text-base mt-1">
            {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <UserPlus size={18} />}
            {loading ? 'Registering…' : 'Register NGO'}
          </button>

          <p className="text-center text-sm" style={{ color: '#94a3b8' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: '#f97316' }} className="font-medium hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
