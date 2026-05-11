import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, BarChart3, Home, Map, Users, Settings, Menu, X, LogOut, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_LINKS = [
  { path: '/home',     label: 'Home',     Icon: Home },
  { path: '/map',      label: 'Map',      Icon: Map },
  { path: '/compare',  label: 'Compare',  Icon: BarChart3 },
  { path: '/dashboard',label: 'Dashboard',Icon: BarChart3 },
  { path: '/admin',    label: 'Admin',    Icon: Settings },
];

export default function Navbar() {
  const { currentUser, ngoProfile, logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <motion.nav 
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass-card rounded-none border-t-0 border-x-0"
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">

        {/* Logo */}
        <Link to={currentUser ? '/home' : '/'} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#f97316,#c2410c)' }}>
            <AlertTriangle size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg hidden sm:block">PovertyHotspot<span style={{ color: '#f97316' }}>TG</span></span>
        </Link>

        {/* Desktop Nav */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ path, label, Icon }) => {
              const active = location.pathname === path;
              return (
                <Link key={path} to={path}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: active ? 'rgba(249,115,22,0.15)' : 'transparent', color: active ? '#f97316' : '#94a3b8' }}>
                  <Icon size={15} />{label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <>
              <span className="hidden md:block text-sm" style={{ color: '#94a3b8' }}>
                {ngoProfile?.ngoName || currentUser.email}
              </span>
              <button 
                onClick={handleLogout} 
                className="btn-outline flex items-center gap-1.5 text-xs py-1.5 px-3 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all"
              >
                <LogOut size={13} /> Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login"  className="btn-outline text-sm py-1.5 px-4">Login</Link>
              <Link to="/signup" className="btn-primary text-sm py-1.5 px-4">Sign Up</Link>
            </div>
          )}

          {/* Mobile burger */}
          {currentUser && (
            <button className="md:hidden p-2" onClick={() => setOpen(!open)} style={{ color: '#f97316' }}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {open && currentUser && (
        <div className="md:hidden border-t py-2 px-4 flex flex-col gap-1"
          style={{ background: 'rgba(10,22,40,0.98)', borderColor: 'rgba(249,115,22,0.2)' }}>
          {NAV_LINKS.map(({ path, label, Icon }) => (
            <Link key={path} to={path} onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium"
              style={{ color: location.pathname === path ? '#f97316' : '#94a3b8' }}>
              <Icon size={15} />{label}
            </Link>
          ))}
        </div>
      )}
    </motion.nav>
  );
}
