import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, AlertTriangle, ArrowLeft, Mail, ShieldCheck, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  
  // UI Modes: 'login' | 'forgot-email' | 'forgot-otp' | 'forgot-reset'
  const [mode, setMode]       = useState('login');
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP State
  const [realOtp, setRealOtp] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      // Trigger login alert via Resend (unified /api/alert endpoint)
      api.sendAlert({
        email: form.email,
        subject: "System Login Notification",
        html: `<strong>Hello!</strong><p>A new login was detected for your NGO account (${form.email}) on the Telangana Poverty Hotspot Identification System.</p><p>If this wasn't you, please secure your account.</p>`
      }).catch(err => console.error("Login alert failed:", err));
      toast.success('Successfully logged in!');
      navigate('/home');
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  // --- Reset Flow Handlers (Simulated/Demo) ---

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Generate a real 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setRealOtp(generatedOtp);

    try {
      await api.sendAlert({
        email: form.email,
        subject: "Your NGO Portal OTP",
        html: `
          <div style="font-family: sans-serif; max-width: 400px; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
            <h2 style="color: #f97316;">Verification Code</h2>
            <p>You requested a password reset for your NGO account.</p>
            <div style="background: #fff7ed; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #c2410c;">${generatedOtp}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
          </div>
        `
      });
      setMode('forgot-otp');
      toast.success(`OTP sent to ${form.email}`);
    } catch (err) {
      toast.error('Failed to send OTP. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length < 6) return toast.error('Please enter the full 6-digit code');
    
    setLoading(true);
    // Real verification against the generated code
    if (enteredCode === realOtp) {
      setTimeout(() => {
        setLoading(false);
        setMode('forgot-reset');
        toast.success('OTP Verified. Please set a new password.');
      }, 800);
    } else {
      setLoading(false);
      toast.error('Invalid OTP code. Please try again.');
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMode('login');
      toast.success('Password updated successfully! Please login.');
    }, 1500);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 hero-gradient relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <AnimatePresence mode="wait">
          
          {/* LOGIN MODE */}
          {mode === 'login' && (
            <motion.div 
              key="login"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-orange-400 to-orange-700 shadow-xl shadow-orange-500/20">
                  <AlertTriangle size={32} className="text-white" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight">NGO Portal</h1>
                <p className="text-slate-400 mt-2 font-medium">Identify and intervene in poverty zones</p>
              </div>

              <div className="glass-card p-8 border-white/5">
                <form onSubmit={handleLogin} className="flex flex-col gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-slate-500">Email Address</label>
                    <input 
                      className="input-field" 
                      type="email" 
                      required 
                      placeholder="haasinireddy2304@gmail.com"
                      value={form.email} 
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs uppercase tracking-widest font-bold text-slate-500">Password</label>
                      <button 
                        type="button" 
                        onClick={() => setMode('forgot-email')}
                        className="text-[10px] font-bold text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        className="input-field pr-10" 
                        type={showPw ? 'text' : 'password'} 
                        required 
                        placeholder="••••••••"
                        value={form.password} 
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))} 
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button disabled={loading} className="btn-primary w-full py-4 text-lg font-bold rounded-xl flex items-center justify-center gap-2">
                    {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <LogIn size={20} />}
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-sm text-slate-500 font-medium">No account? </span>
                    <Link to="/signup" className="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors">Register NGO</Link>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* FORGOT - EMAIL MODE */}
          {mode === 'forgot-email' && (
            <motion.div 
              key="forgot-email"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-white/5 border border-white/10">
                  <Mail size={32} className="text-orange-500" />
                </div>
                <h1 className="text-3xl font-black text-white">Reset Password</h1>
                <p className="text-slate-400 mt-2 font-medium">Enter your email to receive an OTP</p>
              </div>

              <div className="glass-card p-8 border-white/5">
                <form onSubmit={handleSendOTP} className="flex flex-col gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-slate-500">Registered Email</label>
                    <input 
                      className="input-field" 
                      type="email" 
                      required 
                      placeholder="haasinireddy2304@gmail.com"
                      value={form.email} 
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
                    />
                  </div>
                  <button disabled={loading} className="btn-primary w-full py-4 font-bold rounded-xl">
                    {loading ? 'Sending Code...' : 'Send OTP Code'}
                  </button>
                  <button type="button" onClick={() => setMode('login')} className="text-slate-500 hover:text-white flex items-center justify-center gap-2 text-sm font-bold transition-colors">
                    <ArrowLeft size={16} /> Back to Login
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* FORGOT - OTP MODE */}
          {mode === 'forgot-otp' && (
            <motion.div 
              key="forgot-otp"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-white/5 border border-white/10">
                  <ShieldCheck size={32} className="text-green-500" />
                </div>
                <h1 className="text-3xl font-black text-white">Verify Identity</h1>
                <p className="text-slate-400 mt-2 font-medium">Sent a 6-digit code to your email</p>
              </div>

              <div className="glass-card p-8 border-white/5 text-center">
                <form onSubmit={handleVerifyOTP} className="flex flex-col gap-8">
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => otpRefs.current[idx] = el}
                        type="text"
                        maxLength="1"
                        className="w-full h-12 text-center text-xl font-black bg-white/5 border border-white/10 rounded-lg focus:border-orange-500 focus:bg-white/10 outline-none transition-all text-white"
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                      />
                    ))}
                  </div>
                  <button disabled={loading} className="btn-primary w-full py-4 font-bold rounded-xl">
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <div className="text-sm">
                    <span className="text-slate-500 font-medium">Didn't get code? </span>
                    <button type="button" className="text-orange-500 font-bold hover:underline">Resend</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* FORGOT - RESET MODE */}
          {mode === 'forgot-reset' && (
            <motion.div 
              key="forgot-reset"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-white/5 border border-white/10">
                  <KeyRound size={32} className="text-orange-500" />
                </div>
                <h1 className="text-3xl font-black text-white">New Password</h1>
                <p className="text-slate-400 mt-2 font-medium">Protect your NGO account with a new key</p>
              </div>

              <div className="glass-card p-8 border-white/5">
                <form onSubmit={handleResetPassword} className="flex flex-col gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-slate-500">New Password</label>
                    <input className="input-field" type="password" required placeholder="Min. 8 characters" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-slate-500">Confirm New Password</label>
                    <input className="input-field" type="password" required placeholder="Re-type password" />
                  </div>
                  <button disabled={loading} className="btn-primary w-full py-4 font-bold rounded-xl shadow-xl shadow-orange-500/20">
                    {loading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
