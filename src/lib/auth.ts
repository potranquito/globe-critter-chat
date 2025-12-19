/**
 * Authentication helper functions
 * Handles Google OAuth sign-in/sign-out via Supabase Auth
 */

import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  health_contributed: number;
  total_lessons_completed: number;
  created_at: string;
  last_active: string;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }

  return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Get current auth session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return data.session;
}

/**
 * Get current user profile from database
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    console.log('🔵 [getUserProfile] Fetching profile...');

    const { data, error } = await Promise.race([
      supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single(),
      new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]);

    if (error) {
      console.error('🔴 [getUserProfile] Error:', error.message);
      return null;
    }

    console.log('🟢 [getUserProfile] Profile fetched successfully');
    return data;
  } catch (err) {
    console.error('🔴 [getUserProfile] Failed:', err instanceof Error ? err.message : 'Unknown error');
    return null;
  }
}

/**
 * Create or update user profile in database
 * Called after successful authentication
 */
export async function upsertUserProfile(authUser: {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
  };
}): Promise<User | null> {
  console.log('🔵 [upsertUserProfile] Starting...');

  // Generate username from email or name
  const email = authUser.email || '';
  const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';

  let username = fullName.toLowerCase().replace(/\s+/g, '_');
  if (!username) {
    username = email.split('@')[0];
  }

  const profileData = {
    id: authUser.id,
    email: authUser.email,
    username: username,
    avatar_url: authUser.user_metadata?.avatar_url || null,
    last_active: new Date().toISOString(),
  };

  console.log('🔵 [upsertUserProfile] Attempting upsert with conflict resolution...');

  // Try insert first, if it fails due to conflict, try update
  let insertData, insertError;

  try {
    const result = await Promise.race([
      supabase.from('users').insert(profileData).select().single(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Insert timeout')), 5000))
    ]);
    insertData = result.data;
    insertError = result.error;
  } catch (err) {
    console.error('🔴 [upsertUserProfile] Insert timed out or failed:', err);
    insertError = { code: 'timeout', message: err instanceof Error ? err.message : 'Unknown' };
  }

  if (!insertError) {
    console.log('🟢 [upsertUserProfile] Profile created!');
    return insertData;
  }

  // If insert failed due to conflict, try update instead
  if (insertError.code === '23505' || insertError.code === 'timeout') {
    console.log('🔵 [upsertUserProfile] Profile likely exists, trying update...');

    try {
      const result = await Promise.race([
        supabase
          .from('users')
          .update({ last_active: new Date().toISOString(), avatar_url: authUser.user_metadata?.avatar_url || null })
          .eq('id', authUser.id)
          .select()
          .single(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Update timeout')), 5000))
      ]);

      if (result.error) {
        console.error('🔴 [upsertUserProfile] Update failed:', result.error.message);
        return null;
      }

      console.log('🟢 [upsertUserProfile] Profile updated!');
      return result.data;
    } catch (err) {
      console.error('🔴 [upsertUserProfile] Update timed out:', err);
      return null;
    }
  }

  console.error('🔴 [upsertUserProfile] Insert failed:', insertError.message, insertError.code);
  return null;
}

/**
 * Update user's last active timestamp
 */
export async function updateLastActive(userId: string) {
  const { error } = await supabase
    .from('users')
    .update({ last_active: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating last_active:', error);
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
