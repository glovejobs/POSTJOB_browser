'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  apiKey: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Check for existing session
        const storedSession = localStorage.getItem('supabase_session');
        const storedApiKey = localStorage.getItem('api_key');

        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);

          // Verify session is still valid
          const { data: { session: currentSession } } = await supabase.auth.getSession();

          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);

            // Update axios default headers
            api.defaults.headers.common['Authorization'] = `Bearer ${currentSession.access_token}`;
          } else {
            // Session expired, try to refresh
            const refreshToken = parsedSession.refresh_token;
            if (refreshToken) {
              await refreshSession();
            }
          }
        }

        if (storedApiKey) {
          setApiKey(storedApiKey);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session) {
          // Store session
          localStorage.setItem('supabase_session', JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at
          }));

          // Update axios headers
          api.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
        } else {
          // Clear session
          localStorage.removeItem('supabase_session');
          delete api.defaults.headers.common['Authorization'];
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const response = await api.post('/api/auth/register', {
        email,
        password,
        fullName
      });

      if (response.data.session) {
        const { session: newSession, apiKey: newApiKey } = response.data;

        // Store credentials
        localStorage.setItem('supabase_session', JSON.stringify({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
          expires_at: newSession.expires_at
        }));
        localStorage.setItem('api_key', newApiKey);
        localStorage.setItem('user_email', email);
        if (fullName) {
          localStorage.setItem('user_name', fullName);
        }

        // Update state
        setApiKey(newApiKey);

        // Set up axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${newSession.access_token}`;

        // Sign in with Supabase client for real-time features
        await supabase.auth.setSession({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token
        });
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });

      if (response.data.session) {
        const { session: newSession, apiKey: newApiKey } = response.data;

        // Store credentials
        localStorage.setItem('supabase_session', JSON.stringify({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
          expires_at: newSession.expires_at
        }));
        localStorage.setItem('api_key', newApiKey);
        localStorage.setItem('user_email', email);

        // Update state
        setApiKey(newApiKey);

        // Set up axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${newSession.access_token}`;

        // Sign in with Supabase client for real-time features
        await supabase.auth.setSession({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token
        });
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Sign out from backend
      if (session?.access_token) {
        await api.post('/api/auth/logout');
      }

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear local storage
      localStorage.removeItem('supabase_session');
      localStorage.removeItem('api_key');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');

      // Clear axios headers
      delete api.defaults.headers.common['Authorization'];

      // Clear state
      setUser(null);
      setSession(null);
      setApiKey(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      const storedSession = localStorage.getItem('supabase_session');

      if (!storedSession) {
        throw new Error('No session to refresh');
      }

      const parsedSession = JSON.parse(storedSession);
      const response = await api.post('/api/auth/refresh', {
        refresh_token: parsedSession.refresh_token
      });

      if (response.data.session) {
        const { session: newSession } = response.data;

        // Update stored session
        localStorage.setItem('supabase_session', JSON.stringify({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token,
          expires_at: newSession.expires_at
        }));

        // Update axios headers
        api.defaults.headers.common['Authorization'] = `Bearer ${newSession.access_token}`;

        // Update Supabase session
        await supabase.auth.setSession({
          access_token: newSession.access_token,
          refresh_token: newSession.refresh_token
        });
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      // If refresh fails, sign out
      await signOut();
      throw error;
    }
  };

  // Set up automatic token refresh
  useEffect(() => {
    if (!session) return;

    // Calculate when to refresh (5 minutes before expiry)
    const expiresAt = session.expires_at;
    if (!expiresAt) return;

    const expiresInMs = (expiresAt * 1000) - Date.now();
    const refreshInMs = Math.max(0, expiresInMs - (5 * 60 * 1000)); // 5 minutes before expiry

    const refreshTimer = setTimeout(() => {
      refreshSession().catch(console.error);
    }, refreshInMs);

    return () => clearTimeout(refreshTimer);
  }, [session]);

  const value = {
    user,
    session,
    apiKey,
    loading,
    signUp,
    signIn,
    signOut,
    refreshSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}