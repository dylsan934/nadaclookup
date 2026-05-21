import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const FREE_SAVE_LIMIT = 3;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSubscribed: boolean;
  isAdmin: boolean;
  isRoleCheckComplete: boolean;
  isTrialActive: boolean;
  trialEndsAt: string | null;
  subscriptionEnd: string | null;
  isPasswordRecovery: boolean;
  lifetimeSavesCount: number;
  freeSaveLimit: number;
  canSaveDrug: boolean;
  clearPasswordRecovery: () => void;
  checkSubscription: () => Promise<void>;
  refreshSavesCount: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [lifetimeSavesCount, setLifetimeSavesCount] = useState(0);

  const canSaveDrug = isSubscribed || lifetimeSavesCount < FREE_SAVE_LIMIT;

  const refreshSavesCount = async () => {
    if (!user) {
      setLifetimeSavesCount(0);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("lifetime_saves_count")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setLifetimeSavesCount(data.lifetime_saves_count ?? 0);
      }
    } catch (error) {
      console.error("Error fetching lifetime saves count:", error);
    }
  };

  const clearPasswordRecovery = () => {
    setIsPasswordRecovery(false);
  };

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
        // Admins bypass subscription check
        setIsSubscribed(true);
        return true;
      }
      setIsAdmin(false);
      return false;
    } catch (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
  };

  const checkSubscription = async () => {
    if (!session?.access_token || !user) {
      setIsSubscribed(false);
      setIsTrialActive(false);
      setTrialEndsAt(null);
      setSubscriptionEnd(null);
      return;
    }

    // Check if admin first - admins bypass subscription
    const adminCheck = await checkAdminRole(user.id);
    if (adminCheck) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      setIsSubscribed(data?.subscribed ?? false);
      setIsTrialActive(data?.is_trial ?? false);
      setTrialEndsAt(data?.trial_ends_at ?? null);
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth event:", event);
        
        // Detect password recovery event
        if (event === "PASSWORD_RECOVERY") {
          console.log("Password recovery detected in AuthContext!");
          setIsPasswordRecovery(true);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription and saves count when session changes
  useEffect(() => {
    if (session && user) {
      checkSubscription();
      refreshSavesCount();
    } else {
      setIsSubscribed(false);
      setIsAdmin(false);
      setIsTrialActive(false);
      setTrialEndsAt(null);
      setSubscriptionEnd(null);
      setLifetimeSavesCount(0);
    }
  }, [session, user]);

  // Periodic subscription check
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      isSubscribed, 
      isAdmin,
      isTrialActive,
      trialEndsAt,
      subscriptionEnd,
      isPasswordRecovery,
      lifetimeSavesCount,
      freeSaveLimit: FREE_SAVE_LIMIT,
      canSaveDrug,
      clearPasswordRecovery,
      checkSubscription,
      refreshSavesCount,
      signUp, 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
