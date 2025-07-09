import { createClient } from '@supabase/supabase-js';

// These should be in environment variables in production
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database operations
export const databaseService = {
  // Store user's OpenAI API key
  async storeApiKey(userId: string, apiKey: string) {
    try {
      console.log('Attempting to store API key for user:', userId);
      const { data, error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: userId,
          api_key: apiKey,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) {
        console.error('Supabase error storing API key:', error);
        throw error;
      }
      console.log('API key stored successfully');
      return data;
    } catch (error) {
      console.error('Failed to store API key:', error);
      throw error;
    }
  },

  // Get user's OpenAI API key
  async getApiKey(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('api_key')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Supabase error getting API key:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        if (error.code !== 'PGRST116') { // PGRST116 = no rows found
          throw error;
        }
      }
      return data?.api_key || null;
    } catch (error) {
      console.error('Failed to get API key:', error);
      return null;
    }
  },
};

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },

  // Update password
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },
};