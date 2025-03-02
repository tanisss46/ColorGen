import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Dynamic Analytics component
const AnalyticsWrapper = () => {
  const [AnalyticsComponent, setAnalyticsComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Dynamic import of the Analytics component
    import('@vercel/analytics/react')
      .then(module => {
        setAnalyticsComponent(() => module.Analytics);
      })
      .catch(err => {
        console.warn('Analytics failed to load:', err);
      });
  }, []);

  return AnalyticsComponent ? <AnalyticsComponent /> : null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <AnalyticsWrapper />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
