import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SavedDrugs from "./pages/SavedDrugs";
import WhatIsNadac from "./pages/WhatIsNadac";
import NadacUpdateFrequency from "./pages/NadacUpdateFrequency";
import NdcLookup from "./pages/NdcLookup";
import Admin from "./pages/Admin";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import DrugPage from "./pages/DrugPage";
import WeeklyMovers from "./pages/WeeklyMovers";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/saved-drugs" element={<SavedDrugs />} />
              <Route path="/what-is-nadac" element={<WhatIsNadac />} />
              <Route path="/how-often-does-nadac-update" element={<NadacUpdateFrequency />} />
              <Route path="/ndc-lookup" element={<NdcLookup />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogArticle />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/drug/:slug" element={<DrugPage />} />
              <Route path="/movers" element={<WeeklyMovers />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
