/**
 * Sign In Dialog Component
 * Modal dialog for email/password authentication
 */

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2 } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '@/lib/auth-email';
import { useToast } from '@/hooks/use-toast';

interface SignInDialogProps {
  trigger?: React.ReactNode;
}

export function SignInDialog({ trigger }: SignInDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [open, setOpen] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      toast({
        title: 'Signed in!',
        description: 'Welcome back to Globe Critter Chat',
      });
      setOpen(false);
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
        description: 'Welcome to Globe Critter Chat!',
      });
      setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            Sign In
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[420px] p-0 gap-0 flex flex-col">
        <div className="p-6 pb-4">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-bold">
              Welcome to Globe Critter Chat
            </DialogTitle>
            <DialogDescription className="text-sm">
              Sign in to save your progress
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs defaultValue="signin" className="w-full flex flex-col">
          <TabsList className="w-full rounded-none border-y h-11 bg-muted/50">
            <TabsTrigger value="signin" className="flex-1">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="p-6 pt-6 m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <form onSubmit={handleEmailSignIn} className="space-y-4 flex flex-col">
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <Button type="submit" className="w-full h-10 mt-6" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="p-6 pt-6 m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <form onSubmit={handleEmailSignUp} className="space-y-4 flex flex-col">
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="signup-email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="signup-password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-10"
                />
              </div>
              <Button type="submit" className="w-full h-10 mt-6" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
