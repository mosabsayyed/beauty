import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Language } from "./types";
import { RubiksEntry } from "./components/RubiksEntry";
import { LoginPage } from "./pages/LoginPage";
import { TwinLifePage } from "./pages/TwinXperiencePage";
import { ChatOverCoffeePage } from "./pages/ChatOverCoffeePage";
import { OriginsPage } from "./pages/OriginsPage";
import { PresentationPage } from "./pages/PresentationPage";
import ChatAppPage from "./pages/ChatAppPage";
import { Toaster } from "./components/ui/sonner";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return null;
}

function AppContent() {
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
    // Don't save to localStorage for guests
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <ScrollToTop />

      <Routes>
        {/* Route 1: Chat App (NEW DEFAULT) */}
        <Route
          path="/"
          element={<ChatAppPage language={language} />}
        />

        {/* Route 1b: Rubik's Cube Entry (moved) */}
        <Route
          path="/rubiks"
          element={<RubiksEntry language={language} />}
        />

        {/* Route 1c: Direct access to presentation */}
        <Route
          path="/presentation"
          element={<PresentationPage />}
        />

        {/* Route 2: Login/Register */}
        <Route
          path="/experience/login"
          element={
            isAuthenticated ? (
              <Navigate to="/experience" replace />
            ) : (
              <LoginPage
                language={language}
                onLanguageChange={setLanguage}
                onLogin={handleLogin}
                onSkip={handleSkip}
              />
            )
          }
        />

        {/* Route 3: Main Experience (Noor Portal) */}
        <Route
          path="/experience"
          element={
            <TwinLifePage
              language={language}
              onLanguageChange={setLanguage}
              isAuthenticated={isAuthenticated}
            />
          }
        />

        {/* Legacy Routes (Direct Access Retained) */}
        <Route
          path="/coffee"
          element={
            <ChatOverCoffeePage
              language={language}
              onLanguageChange={setLanguage}
            />
          }
        />
        <Route
          path="/origins"
          element={
            <OriginsPage
              language={language}
              onLanguageChange={setLanguage}
            />
          }
        />
        <Route
          path="/chatapp"
          element={<ChatAppPage language={language} />}
        />

        {/* Catch-all: Redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}