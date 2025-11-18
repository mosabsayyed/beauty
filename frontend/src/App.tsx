import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Language } from "./types";
import ChatAppPage from "./pages/ChatAppPage";
import { LoginPage } from "./pages/LoginPage";
import WelcomeEntry from './pages/WelcomeEntry';
import { AuthProvider } from './contexts/AuthContext';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const isWelcomePage = location.pathname === '/';
  
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("josoor_language");
      return (saved as Language) || "en";
    } catch {
      return "en";
    }
  });

  const [isAuthenticated, setIsAuthenticated] =
    useState<boolean>(() => {
      try {
        const saved = localStorage.getItem(
          "josoor_authenticated",
        );
        return saved === "true";
      } catch {
        return false;
      }
    });

  useEffect(() => {
    try {
      localStorage.setItem("josoor_language", language);
    } catch {
      // localStorage not available
    }
    document.documentElement.lang = language;
    document.documentElement.dir =
      language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem("josoor_authenticated", "true");
    } catch {
      // localStorage not available
    }
  };

  const handleSkip = () => {
    setIsAuthenticated(true);
    // Persist guest flag so a reload doesn't redirect back to the welcome page
    try {
      localStorage.setItem('josoor_authenticated', 'true');
    } catch {
      // ignore localStorage errors
    }
  };

  return (
    <div className={isWelcomePage ? "" : "min-h-screen bg-slate-100"}>
      <ScrollToTop />

      <Routes>
        <Route
          path="/"
          element={<WelcomeEntry/>}
        />

        <Route path="/chat" element={<ChatAppPage language={language} />} />

        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
