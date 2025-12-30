import { Pill, LogIn, LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="gradient-hero text-primary-foreground py-16 md:py-24 relative">
      {/* Auth buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-primary-foreground/80 hidden sm:inline">
              <User className="h-4 w-4 inline mr-1" />
              {user.email}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Sign In
            </Button>
          </Link>
        )}
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center animate-fade-in">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-glow">
            <Pill className="h-8 w-8 md:h-10 md:w-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            NADAC Drug Pricing
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
            Search the National Average Drug Acquisition Cost database for current pharmaceutical pricing information.
          </p>
        </div>
      </div>
    </header>
  );
};
