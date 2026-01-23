import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import FindTutors from "./pages/FindTutors";
import AIMatching from "./pages/AIMatching";
import BookSession from "./pages/BookSession";
import Sessions from "./pages/Sessions";
import Messages from "./pages/Messages";
import Leaderboard from "./pages/Leaderboard";
import Monitoring from "./pages/Monitoring";
import TutorManagement from "./pages/TutorManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/find-tutors" element={<FindTutors />} />
            <Route path="/ai-matching" element={<AIMatching />} />
            <Route path="/book/:tutorId" element={<BookSession />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/tutor-management" element={<TutorManagement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
