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
      const profile = await getUserProfile(userId);
      setUser(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = onAuthStateChange(async (event, currentSession) => {
      console.log('Auth event:', event);

      if (!mounted) return;

      setSession(currentSession);

      if (currentSession?.user) {
        // User is signed in
        const authUser = currentSession.user;

        // Create or update user profile in database
        const profile = await upsertUserProfile({
          id: authUser.id,
          email: authUser.email,
          user_metadata: authUser.user_metadata
        });

        if (profile) {
          setUser(profile);

          // Show welcome toast on sign in
          if (event === 'SIGNED_IN') {
            toast({
              title: 'Welcome back!',
              description: `Signed in as ${profile.username}`,
            });
          }

          // Update last active timestamp
          updateLastActive(authUser.id);
        }
      } else {
        // User is signed out
        setUser(null);

        if (event === 'SIGNED_OUT') {
          toast({
            title: 'Signed out',
            description: 'You have been signed out successfully.',
          });
        }
      }

      setLoading(false);
    });

    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession?.user && mounted) {
          setSession(existingSession);
          await fetchUserProfile(existingSession.user.id);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        if (mounted) {
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
