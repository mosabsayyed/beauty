import { useEffect } from "react";
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
import WelcomeEntry from './pages/WelcomeEntry';
import CanvasTestPage from './pages/CanvasTestPage';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return null;
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

        <Route path="/chat" element={<ChatAppPage />} />

        <Route path="/canvas-test" element={<CanvasTestPage />} />

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
        <LanguageProvider>
          <AppRoutes />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
