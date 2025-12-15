import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
  useNavigate,
} from "react-router-dom";
import ChatAppPage from "./pages/ChatAppPage";
import { LoginPage } from "./pages/LoginPage";
import LandingPage from './pages/LandingPage';
import WelcomeEntry from './pages/WelcomeEntry';
import CanvasTestPage from './pages/CanvasTestPage';
import FounderLetterPage from './pages/FounderLetterPage';
import ContactUsPage from './pages/ContactUsPage';
import ArchitecturePage from './pages/ArchitecturePage';
import ObservabilityPage from './pages/ObservabilityPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return null;
}


function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/landing" replace />;
  }
  return children;
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const isWelcomePage = location.pathname === "/";

  const handleLogin = () => {
    try {
      localStorage.setItem("josoor_authenticated", "true");
    } catch {}
    navigate('/chat', { replace: true });
  };

  return (
    <div className={isWelcomePage ? "" : "min-h-screen bg-slate-100"}>
      <ScrollToTop />

      <Routes>
        <Route
          path="/"
          element={<WelcomeEntry/>}
        />

        <Route path="/landing" element={<LandingPage />} />

        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatAppPage />
          </ProtectedRoute>
        } />

        <Route path="/architecture" element={<ArchitecturePage />} />

        <Route path="/canvas-test" element={<CanvasTestPage />} />

        <Route path="/founder-letter" element={<FounderLetterPage />} />

        <Route path="/contact-us" element={<ContactUsPage />} />

        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

        {/* Admin-only route - not linked in UI */}
        <Route path="/admin/observability" element={<ObservabilityPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  );
}

export default function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <AppRoutes />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
