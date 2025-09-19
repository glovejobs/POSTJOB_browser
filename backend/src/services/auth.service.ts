import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/environment';

class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );
  }

  async signUp(email: string, password: string, metadata?: { full_name?: string }) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async signOut(token: string) {
    try {
      const { error } = await this.supabase.auth.admin.signOut(token);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error };
    }
  }

  async verifyToken(token: string) {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  async refreshToken(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async resetPassword(email: string) {
    const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async updatePassword(_token: string, newPassword: string) {
    const { data, error } = await this.supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('postjob_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('postjob_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let apiKey = 'pk_';
    for (let i = 0; i < 32; i++) {
      apiKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return apiKey;
  }

  async createOrUpdateUserProfile(user: any) {
    const apiKey = this.generateApiKey();

    const { data: existingUser, error: fetchError } = await this.supabase
      .from('postjob_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingUser) {
      return existingUser;
    }

    const { data, error } = await this.supabase
      .from('postjob_users')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        api_key: apiKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}

export default new AuthService();