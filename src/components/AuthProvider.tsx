/**
 * AuthProvider Component
 * Manages authentication state and provides auth context to the app
 */

import { createContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  signInWithGoogle,
  signOut,
  getUserProfile,
  upsertUserProfile,
  onAuthStateChange,
  updateLastActive,
  type User
} from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔵 Fetching user profile...');
      const profile = await getUserProfile(userId);
      if (profile) {
        console.log('🔵 User profile loaded');
        setUser(profile);
      } else {
        console.error('🔴 Profile fetch returned null');
        setUser(null);
      }
    } catch (error) {
      console.error('🔴 Error fetching user profile:', error);
      setUser(null);
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = onAuthStateChange(async (event, currentSession) => {
      console.log('🟢 Auth state change:', event, 'has session:', !!currentSession);

      if (!mounted) return;

      setSession(currentSession);

      if (currentSession?.user) {
        // User is signed in
        const authUser = currentSession.user;
        console.log('🟢 User authenticated, creating/updating profile');
        console.log('🟢 Auth user data:', { id: authUser.id, email: authUser.email, metadata: authUser.user_metadata });

        try {
          // Create or update user profile in database
          const profile = await upsertUserProfile({
            id: authUser.id,
            email: authUser.email,
            user_metadata: authUser.user_metadata
          });

          console.log('🟢 Profile result:', profile);

          if (profile) {
            setUser(profile);
            console.log('🟢 User state set to:', profile.username);

            // Show welcome toast on sign in
            if (event === 'SIGNED_IN') {
              toast({
                title: 'Welcome back!',
                description: `Signed in as ${profile.username}`,
              });
            }

            // Update last active timestamp
            updateLastActive(authUser.id);
          } else {
            console.error('🔴 Profile creation/update returned null!');
            console.error('🔴 Check database permissions and user table structure');
          }
        } catch (profileError) {
          console.error('🔴 Exception during profile creation:', profileError);
        }
      } else {
        // User is signed out
        setUser(null);
        console.log('🟢 User signed out');

        if (event === 'SIGNED_OUT') {
          toast({
            title: 'Signed out',
            description: 'You have been signed out successfully.',
          });
        }
      }

      console.log('🟢 Setting loading to false');
      setLoading(false);
    });

    // Check for existing session on mount
    // Note: We don't fetch the profile here because the auth state listener will handle it
    const checkSession = async () => {
      console.log('🔵 Checking for existing session...');
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        console.log('🔵 Existing session:', !!existingSession);

        if (existingSession?.user && mounted) {
          console.log('🔵 Found existing session - auth listener will handle profile fetch');
          setSession(existingSession);
          // Don't fetch profile here - let the auth state listener handle it
          // This avoids timing issues with the Supabase client initialization
        } else {
          console.log('🔵 No existing session found');
          // Only set loading to false if no session exists
          if (mounted) {
            console.log('🔵 No session, setting loading to false');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('🔴 Error checking session:', error);
        // Set loading to false on error
        if (mounted) {
          console.log('🔵 Error occurred, setting loading to false');
          setLoading(false);
        }
      }
    };

    checkSession();

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  // Sign in handler
  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // Auth state change will be handled by the listener
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: 'Sign in failed',
        description: 'Could not sign in with Google. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Sign out failed',
        description: 'Could not sign out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh user profile
  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
