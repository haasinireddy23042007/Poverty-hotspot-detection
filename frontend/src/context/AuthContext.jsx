import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [ngoProfile, setNgoProfile]   = useState(null);
  const [loading, setLoading]          = useState(true);

  async function signup({ email, password, ngoName, registrationNo, district }) {
    // 1. Create Supabase Auth User
    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ngoName,
          registrationNo,
          district
        }
      }
    });

    if (authError) throw authError;

    const profile = {
      uid: user.id,
      email,
      ngo_name: ngoName,
      registration_no: registrationNo,
      district,
      alert_threshold: 70,
      notification_history: [],
      monitored_districts: [district],
      created_at: new Date().toISOString(),
    };

    // 2. Save profile to 'ngos' table
    const { error: dbError } = await supabase
      .from('ngos')
      .upsert([profile]);

    if (dbError) {
      console.error('Profile saving error:', dbError.message);
      // Even if profile fails, user is created. We'll handle it during load.
    }

    setNgoProfile(profile);
    return user;
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  }

  async function logout() {
    await supabase.auth.signOut();
    setNgoProfile(null);
    setCurrentUser(null);
  }

  async function loadNgoProfile(uid) {
    try {
      const { data, error } = await supabase
        .from('ngos')
        .select('*')
        .eq('uid', uid)
        .single();

      if (error) throw error;
      setNgoProfile(data);
    } catch (_) {
      // Fallback for demo or if profile missing
      setNgoProfile({
        uid, ngo_name: 'NGO (Syncing...)', district: 'Telangana',
        alert_threshold: 70, monitored_districts: ['Adilabad'],
        notification_history: [],
      });
    }
  }

  useEffect(() => {
    let authSub = null;
    
    async function initAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const user = session?.user ?? null;
        setCurrentUser(user);
        if (user) {
          await loadNgoProfile(user.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }

      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          const user = session?.user ?? null;
          setCurrentUser(user);
          if (user) {
            await loadNgoProfile(user.id);
          } else {
            setNgoProfile(null);
          }
          setLoading(false);
        });
        authSub = subscription;
      } catch (err) {
        console.error("Auth state change listener error:", err);
      }
    }

    initAuth();

    return () => {
      if (authSub) authSub.unsubscribe();
    };
  }, []);

  const value = { currentUser, ngoProfile, setNgoProfile, signup, login, logout, loading };
  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-navy">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
