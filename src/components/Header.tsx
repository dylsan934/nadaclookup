import { Pill } from "lucide-react";

export const Header = () => {
  return (
    <header className="gradient-hero text-primary-foreground py-16 md:py-24">
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
