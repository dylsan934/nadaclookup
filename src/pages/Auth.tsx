import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Bookmark, Calculator, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(() => searchParams.get("mode") !== "signup");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, isLoading, signIn, signUp, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Only redirect if not in password reset mode
  useEffect(() => {
    if (user && !isLoading && !isPasswordRecovery) {
      navigate("/");
    }
  }, [user, isLoading, navigate, isPasswordRecovery]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
        setIsForgotPassword(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please enter and confirm your new password.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password updated!",
          description: "Your password has been successfully reset.",
        });
        clearPasswordRecovery();
        setPassword("");
        setConfirmPassword("");
        navigate("/");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/?welcome=1`,
      });
      if (result.error) {
        toast({
          title: "Google sign-in failed",
          description: result.error.message ?? "Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      if (result.redirected) {
        // Browser will navigate away to Google
        return;
      }
      navigate("/?welcome=1");
    } catch (err) {
      toast({
        title: "Google sign-in failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message === "Invalid login credentials" 
              ? "Invalid email or password. Please try again."
              : error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate("/");
        }
      } else {
        const { data, error } = await signUp(email, password);
        if (error) {
          // Handle various signup error cases
          const errorMessage = error.message.toLowerCase();
          if (errorMessage.includes("already registered") || 
              errorMessage.includes("user already registered") ||
              errorMessage.includes("already exists")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
            setIsLogin(true); // Switch to login view
          } else if (errorMessage.includes("invalid email")) {
            toast({
              title: "Invalid email",
              description: "Please enter a valid email address.",
              variant: "destructive",
            });
          } else if (errorMessage.includes("password")) {
            toast({
              title: "Password issue",
              description: "Password must be at least 6 characters long.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else if (data?.session) {
          // Auto-confirmed signup — user is already signed in
          toast({
            title: "Account created!",
            description: "Welcome! You can now access all features.",
          });
          navigate("/?welcome=1");
        } else {
          // Email confirmation required — no session until they click the link
          toast({
            title: "Check your email",
            description: `We sent a confirmation link to ${email} to activate your account.`,
          });
          setIsLogin(true);
          setPassword("");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Password Reset View (after clicking email link)
  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
            <CardDescription>
              Enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot Password View
  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-sm text-primary hover:underline"
              >
                ← Back to sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Value Proposition */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">NADAC Pricing</h1>
          <p className="text-muted-foreground">
            Access real-time drug pricing data
          </p>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-semibold">
              {isLogin ? "Welcome back" : "Start your 7-day free Pro trial"}
            </CardTitle>
            <CardDescription className="text-balance">
              {isLogin 
                ? "Sign in to access your saved drugs and settings" 
                : "Create your account, then try every Pro feature free for 7 days. No charge until day 8 · Cancel anytime."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.31 0-6.01-2.74-6.01-6.1S8.69 5.9 12 5.9c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.86 3.36 14.66 2.4 12 2.4 6.79 2.4 2.6 6.59 2.6 11.8s4.19 9.4 9.4 9.4c5.42 0 9-3.81 9-9.18 0-.62-.07-1.09-.16-1.82H12z"/>
              </svg>
              Continue with Google
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  isLogin ? "Sign In" : "Create Account & Start Trial"
                )}
              </Button>
            </form>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin 
                  ? "Don't have an account? Sign up free" 
                  : "Already have an account? Sign in"}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground hover:underline"
              >
                ← Continue without an account
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-center">What you get with an account:</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4 text-primary" />
              <span>Unlimited searches</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bookmark className="h-4 w-4 text-primary" />
              <span>Save drugs</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calculator className="h-4 w-4 text-primary" />
              <span>Pricing calculator</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bell className="h-4 w-4 text-primary" />
              <span>Price alerts</span>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground pt-1">
            Some features require a Pro subscription
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
