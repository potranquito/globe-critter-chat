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
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
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
  // Generate username from email or name
  const email = authUser.email || '';
  const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';

  // Try to use name first, fallback to email prefix
  let username = fullName.toLowerCase().replace(/\s+/g, '_');
  if (!username) {
    username = email.split('@')[0];
  }

  // Ensure username is unique by appending random suffix if needed
  let finalUsername = username;
  let attempts = 0;
  while (attempts < 5) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', finalUsername)
      .neq('id', authUser.id)
      .single();

    if (!existingUser) {
      break; // Username is available
    }

    // Try with random suffix
    finalUsername = `${username}_${Math.floor(Math.random() * 10000)}`;
    attempts++;
  }

  // Upsert user profile
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: authUser.id,
      email: authUser.email,
      username: finalUsername,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      last_active: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }

  return data;
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
