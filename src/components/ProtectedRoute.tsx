/**
 * ProtectedRoute Component
 * Requires user authentication before allowing access to gameplay
 * Shows sign-in prompt if user is not authenticated
 */

import { useContext, ReactNode, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthProvider';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2 } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '@/lib/auth-email';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useContext(AuthContext);
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Show loading spinner while checking auth state
  if (auth?.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-300 mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      toast({
        title: 'Signed in!',
        description: 'Welcome back to Globe Critter Chat',
      });
    } catch (error: any) {
      toast({
        title: 'Sign in failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUpWithEmail(email, password);
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account',
      });
    } catch (error: any) {
      toast({
        title: 'Sign up failed',
        description: error.message || 'Could not create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If not authenticated, show sign-in prompt
  if (!auth?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Sign In Required</CardTitle>
            <CardDescription className="text-center">
              You need to sign in to play and save your progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>By signing in, you'll be able to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Save your park progress across devices</li>
                <li>Track completed eco-regions</li>
                <li>Earn stars for completing parks</li>
                <li>Never lose your progress</li>
              </ul>
            </div>

            <div className="w-full space-y-4">
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleEmailSignIn} className="space-y-5 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-base font-semibold">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 text-base px-4"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-base font-semibold">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 text-base px-4"
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 text-base font-semibold mt-6" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Sign In
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleEmailSignUp} className="space-y-5 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-base font-semibold">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 text-base px-4"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-base font-semibold">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="At least 6 characters"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="h-12 text-base px-4"
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 text-base font-semibold mt-6 bg-primary hover:bg-primary/90" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        Create Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full"
            >
              Go Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}
