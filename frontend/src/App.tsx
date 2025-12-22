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
import JosoorDashboardPage from './pages/josoor-dashboards/JosoorDashboardPage';
import { JosoorV2Page } from './pages/josoor-v2/JosoorV2Page';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ObservabilityPage from './pages/ObservabilityPage';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}


function ProtectedRoute({ children, allowGuest = false }: { children: React.ReactElement; allowGuest?: boolean }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    if (allowGuest) {
      // Allow guest access for this route
      return children;
    }
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

        <Route path="/landing" element={
          <ProtectedRoute allowGuest={true}>
            <LandingPage />
          </ProtectedRoute>
        } />

        <Route path="/chat" element={
          <ProtectedRoute allowGuest={true}>
            <ChatAppPage />
          </ProtectedRoute>
        } />

        <Route path="/architecture" element={<ArchitecturePage />} />

        <Route path="/canvas-test" element={<CanvasTestPage />} />

        <Route path="/josoor-dashboards" element={<JosoorDashboardPage />} />
        <Route path="/josoor-v2" element={<JosoorV2Page />} />

        <Route path="/founder-letter" element={<FounderLetterPage />} />

        <Route path="/contact-us" element={<ContactUsPage />} />

        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

        {/* Dashboard route - protected */}
        {/* Dashboard route - bypass auth if requested */}
        <Route path="/admin/settings" element={<ObservabilityPage mode="admin-only" />} />
        <Route path="/admin/observability" element={<ObservabilityPage mode="full" />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <JosoorDashboardPage />
          </ProtectedRoute>
        } />

        {/* JOSOOR V2 ISOLATED SANDBOX */}
        <Route path="/josoor-v2" element={
           <ProtectedRoute>
              {/* Ensure we lazy load or directly import. For now direct import is fine as per file size */}
              <React.Suspense fallback={<div>Loading V2...</div>}>
                  <JosoorV2Page />
              </React.Suspense>
           </ProtectedRoute>
        } />

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
