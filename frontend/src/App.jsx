import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar    from './components/Navbar';
import Landing   from './pages/Landing';
import Login     from './pages/Login';
import Signup    from './pages/Signup';
import Home      from './pages/Home';
import MapPage   from './pages/MapPage';
import DistrictDetail from './pages/DistrictDetail';
import Compare        from './pages/Compare';
import NGODashboard   from './pages/NGODashboard';
import Admin     from './pages/Admin';
import PageTransition from './components/PageTransition';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/"       element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/login"  element={<PageTransition><Login /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/map"    element={<PageTransition><MapPage /></PageTransition>} />
        <Route path="/district/:name" element={<PageTransition><DistrictDetail /></PageTransition>} />
        <Route path="/compare" element={<PageTransition><Compare /></PageTransition>} />

        {/* Protected */}
        <Route path="/home"      element={<ProtectedRoute><PageTransition><Home /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><NGODashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/admin"     element={<ProtectedRoute><PageTransition><Admin /></PageTransition></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { 
            background: 'hsl(216, 60%, 15%)', 
            color: '#f1f5f9', 
            border: '1px solid hsla(24, 94%, 53%, 0.2)',
            backdropFilter: 'blur(8px)'
          },
        }} />
        <div className="min-h-screen bg-navy transition-colors duration-500">
          <Navbar />
          <main>
            <AnimatedRoutes />
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
