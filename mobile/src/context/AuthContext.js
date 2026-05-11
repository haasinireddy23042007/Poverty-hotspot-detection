import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [ngoProfile, setNgoProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadNgoProfile(uid) {
    try {
      const { data, error } = await supabase
        .from('ngos')
        .select('*')
        .eq('uid', uid)
        .single();
      if (!error && data) {
        setNgoProfile(data);
      } else {
        // Fallback for demo
        setNgoProfile({
          uid,
          ngo_name: 'NGO (Syncing...)',
          district: 'Telangana',
          alert_threshold: 70,
          monitored_districts: ['Adilabad'],
        });
      }
    } catch (_) {}
  }

  useEffect(() => {
    let authSub = null;
    
    async function initAuth() {
      console.log("Initializing Auth...");
      const timeout = setTimeout(() => {
        if (loading) {
          console.log("Auth init timeout reached, forcing loading to false");
          setLoading(false);
        }
      }, 5000);

      try {
        console.log("Getting session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const user = session?.user ?? null;
        console.log("User session found:", !!user);
        setCurrentUser(user);
        if (user) {
          await loadNgoProfile(user.id);
        }
      } catch (err) {
        console.log("Auth init error:", err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
        console.log("Auth initialized.");
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
        console.log("Auth state error:", err);
      }
    }

    initAuth();
    return () => {
      if (authSub) authSub.unsubscribe();
    };
  }, []);

  async function signup({ email, password, ngoName, registrationNo, district }) {
    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { ngoName, registrationNo, district }
      }
    });

    if (authError) throw authError;
    if (!user) throw new Error('Signup succeeded but no user was returned. Please try logging in.');

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

    const { error: dbError } = await supabase.from('ngos').upsert([profile]);
    if (dbError) {
      console.error('Profile save error:', dbError.message);
      // Don't block login — user is created, profile can be re-synced on next load
    }
    setNgoProfile(profile);
    return user;
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  }

  async function logout() {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setNgoProfile(null);
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  const value = { currentUser, ngoProfile, login, logout, signup, resetPassword, loading };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
