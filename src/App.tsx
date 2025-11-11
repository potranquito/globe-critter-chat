import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/auth/callback";
import SpinWheelDemo from "./pages/SpinWheelDemo";
import PacmanDemo from "./pages/PacmanDemo";
import WhackAMoleDemo from "./pages/WhackAMoleDemo";
import PixelGamePage from "./pages/PixelGamePage";
import TriviaPage from "./pages/TriviaPage";
import ParkSelectionPage from "./pages/ParkSelectionPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/park-select" element={<ParkSelectionPage />} />
          <Route
            path="/trivia"
            element={
              <ProtectedRoute>
                <TriviaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pixel-game"
            element={
              <ProtectedRoute>
                <PixelGamePage />
              </ProtectedRoute>
            }
          />
          <Route path="/spin-demo" element={<SpinWheelDemo />} />
          <Route path="/pacman-demo" element={<PacmanDemo />} />
          <Route path="/whack-a-mole-demo" element={<WhackAMoleDemo />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
