import { useState, useEffect } from 'react';
// Using image assets for sidebar icons (PNG/JPG). Avoiding SVG icon components as requested.
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import type { ConversationSummary } from '../../types/api';
import './Sidebar.css';
import '../../styles/sidebar.css';
import { useNavigate } from 'react-router-dom';
import { getUser, logout as authLogout, getGuestConversations, isGuestMode } from '../../services/authService';
import { useLanguage } from '../../contexts/LanguageContext';

interface QuickAction {
  id: string;
  // path to image in public/ (use PNG/JPG). Example: '/logo192.png'
  icon: string;
  label: { en: string; ar: string };
  command: { en: string; ar: string };
  category: 'learn' | 'explore' | 'tools';
}

/**
 * QUICK ACTIONS CONFIGURATION
 * ---------------------------
 * These sidebar items trigger special actions when clicked via onQuickAction().
 * 
 * Each action.id maps to a handler in ChatAppPage.handleQuickAction():
 *   - 'knowledge'    → Opens TwinKnowledge component (with landing page)
 *   - 'demo'         → Opens GraphDashboard for Strategic Planning (with landing page)
 *   - 'architecture' → Opens ProductRoadmap component (DIRECT - no landing page)
 *   - 'approach'     → Opens PlanYourJourney component (DIRECT - no landing page)
 * 
 * The command field is for chat fallback; icons are displayed in the sidebar.
 */
const quickActions: QuickAction[] = [
  { id: 'knowledge', icon: '/icons/twin.svg', label: { en: 'Twin Knowledge', ar: 'علوم التوأمة' }, command: { en: 'Show me the first use case', ar: 'أرني حالة الاستخدام الأولى' }, category: 'learn' },
  { id: 'demo', icon: '/icons/demo.svg', label: { en: 'Intelligent Dashboards', ar: 'لوحات القيادة الذكية' }, command: { en: 'Explain Twin Science', ar: 'اشرح علم التوأم' }, category: 'learn' },
  { id: 'architecture', icon: '/icons/architecture.svg', label: { en: 'Product Roadmap', ar: 'خارطة طريق المنتج' }, command: { en: 'Describe architecture', ar: 'اشرح التصميم الهيكلي' }, category: 'explore' },
  { id: 'approach', icon: '/icons/approach.svg', label: { en: 'Plan Your Journey', ar: 'خطط رحلتك' }, command: { en: 'Tell me about approach', ar: 'أخبرني عن المنهجية' }, category: 'explore' },
];

interface SidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: number | null;
  onNewChat: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  onQuickAction: (action: QuickAction | string) => void;
  isCollapsed?: boolean; // optional initial state
  onRequestToggleCollapse?: () => void; // notify parent to toggle sidebar width
}

export function Sidebar({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onQuickAction,
  isCollapsed = false,
  onRequestToggleCollapse,
}: SidebarProps) {
  const { language, isRTL, setLanguage } = useLanguage();
  const [showConversations, setShowConversations] = useState(() => conversations.length > 0);
  const [collapsed, setCollapsed] = useState<boolean>(!!isCollapsed);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      const themeAttr = document.documentElement.getAttribute('data-theme');
      setTheme((themeAttr as 'light' | 'dark') || 'dark');
    };
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (conversations.length > 0) setShowConversations(true);
  }, [conversations.length]);

  useEffect(() => {
    // keep collapsed in sync if parent controls it
    setCollapsed(!!isCollapsed);
  }, [isCollapsed]);

  const [currentUser, setCurrentUser] = useState<any | null>(() => getUser());

  useEffect(() => {
    const onStorage = () => {
      setCurrentUser(getUser());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('josoor_auth_change', onStorage as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('josoor_auth_change', onStorage as EventListener);
    };
  }, []);

  const navigate = useNavigate();

  const translations = {
    appName: language === 'ar' ? 'جسور' : 'JOSOOR',
    newChat: language === 'ar' ? 'محادثة جديدة' : 'New Chat',
    quickActions: language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions',
    conversations: language === 'ar' ? 'المحادثات' : 'Conversations',
    guestMode: language === 'ar' ? 'وضع الضيف' : 'Guest Mode',
    loginToSave: language === 'ar' ? 'سجل الدخول للحفظ' : 'Login to save',
    messagesCount: (count: number) => (language === 'ar' ? `${count} سالة` : `${count} messages`),
    deleteConversation: language === 'ar' ? 'حذف' : 'Delete',
    account: language === 'ar' ? 'الحساب' : 'Account',
    toggleSidebar: language === 'ar' ? 'تبديل الشريط الجانبي' : 'Toggle sidebar',
    guestLeaveWarning: language === 'ar' ? 'أنت تستخدم التطبيق كضيف ولديك محفوظات محلية. إذا غادرت فسوف تفقد السجل والملفات. المتابعة إلى تسجيل الدخول؟' : 'You are using the app as guest and have local history. If you leave you will lose history and artifacts. Proceed to login?',
    account_menu: language === 'ar' ? 'قائمة الحساب' : 'Account menu',
    profile: language === 'ar' ? 'الملف الشخصي' : 'Profile',
    logout: language === 'ar' ? 'تسجيل الخروج' : 'Logout',
    close: language === 'ar' ? 'إغلاق' : 'Close',
    theme: language === 'ar' ? 'المظهر' : 'Theme',
    language: language === 'ar' ? 'اللغة' : 'Language',
    light: language === 'ar' ? 'فاتح' : 'Light',
    dark: language === 'ar' ? 'داكن' : 'Dark',
    english: 'English',
    arabic: 'العربية',
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'ar' ? 'الآن' : 'Now';
    if (diffMins < 60) return language === 'ar' ? `${diffMins} د` : `${diffMins}m`;
    if (diffHours < 24) return language === 'ar' ? `${diffHours} س` : `${diffHours}h`;
    if (diffDays < 7) return language === 'ar' ? `${diffDays} ي` : `${diffDays}d`;

    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // We're using the canonical action labels directly from `quickActions`.
  // No labelOverrides are needed in this simplified approach.

  // Icons sequence for collapsed view (logos only) — exclude login (rendered at bottom)
  const collapsedIconSequence: { id: string; src: string; alt: string; onClick?: () => void }[] = [
    // New Chat button
    { id: 'newchat', src: '/icons/new.svg', alt: 'New Chat', onClick: onNewChat },
    // Hamburger (toggle)
    { id: 'hamburger', src: '', alt: 'Toggle' },
    // Twin Knowledge (knowledge)
    { id: 'knowledge', src: quickActions.find((q) => q.id === 'knowledge')?.icon || '/icons/josoor.svg', alt: quickActions.find((q) => q.id === 'knowledge')?.label[language] || quickActions.find((q) => q.id === 'knowledge')?.label.en || 'Twin Knowledge', onClick: () => onQuickAction(quickActions.find((q) => q.id === 'knowledge')!) },
    // Demo with Noor (demo)
    { id: 'demo', src: quickActions.find((q) => q.id === 'demo')?.icon || '/icons/josoor.svg', alt: quickActions.find((q) => q.id === 'demo')?.label[language] || quickActions.find((q) => q.id === 'demo')?.label.en || 'Demo with Noor', onClick: () => onQuickAction(quickActions.find((q) => q.id === 'demo')!) },
    // Architecture (architecture)
    { id: 'architecture', src: quickActions.find((q) => q.id === 'architecture')?.icon || '/icons/josoor.svg', alt: quickActions.find((q) => q.id === 'architecture')?.label[language] || quickActions.find((q) => q.id === 'architecture')?.label.en || 'Architecture and Features', onClick: () => onQuickAction(quickActions.find((q) => q.id === 'architecture')!) },
    // Approach (approach)
    { id: 'approach', src: quickActions.find((q) => q.id === 'approach')?.icon || '/icons/josoor.svg', alt: quickActions.find((q) => q.id === 'approach')?.label[language] || quickActions.find((q) => q.id === 'approach')?.label.en || 'Approach and UC001', onClick: () => onQuickAction(quickActions.find((q) => q.id === 'approach')!) },
    // Conversations icon (reuse collapse image)
    { id: 'conversations', src: '/icons/chat.svg', alt: 'Conversations', onClick: () => setShowConversations((s) => !s) },
  ];

  // If collapsed, render thin icon-only sidebar with top group and bottom login fixed
  if (collapsed) {
    return (
      <aside className="sidebar collapsed tajawal-headings cairo-body" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="sidebar-collapsed-top">
          {collapsedIconSequence.map((item) => {
            if (item.id === 'hamburger') {
              return (
                <button
                  key={item.id}
                  onClick={() => { if (onRequestToggleCollapse) { onRequestToggleCollapse(); } else { setCollapsed(false); } }}
                  title={item.alt}
                  className="sidebar-icon-button clickable"
                >
                  <img src="/icons/menu.svg" alt={item.alt} className="sidebar-quickaction-icon sidebar-quickaction-small" />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => item.onClick?.()}
                title={item.alt}
                className="sidebar-icon-button clickable"
              >
                <img src={item.src} alt={item.alt} className="sidebar-quickaction-icon sidebar-quickaction-small" />
              </button>
            );
          })}
        </div>

        {/* Login at bottom - same avatar as expanded */}
        <div className="collapsed-login-cta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: 'auto' }}>
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button title={translations.account} className="collapsed-login-button clickable" style={{ width: '32px', height: '32px', border: 'none', padding: 0, cursor: 'pointer', overflow: 'hidden', flexShrink: 0, background: 'var(--component-color-success)', borderRadius: '50%' }}>
                  <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Faa1d3e8edf5b47d1b88df2eb208d3cac" alt="profile" style={{ width: '100%', height: '100%', display: 'block' }} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" style={{ width: '240px', backgroundColor: 'var(--component-panel-bg)', color: 'var(--component-text-primary)', border: '1px solid var(--component-panel-border)', marginLeft: '10px' }}>
                <div style={{ padding: '12px', borderBottom: '1px solid var(--component-panel-border)', marginBottom: '4px' }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{currentUser?.user_metadata?.full_name || translations.account}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--component-text-secondary)' }}>{currentUser?.email}</p>
                </div>
                <DropdownMenuItem className="clickable" onClick={() => setIsProfileOpen(true)}>
                  <span>👤 {translations.profile}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="clickable" onClick={() => setIsSettingsOpen(true)}>
                  <span>⚙️ {language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="clickable" style={{ color: 'var(--component-color-danger)' }} onClick={async () => { 
                  try { await authLogout(); } catch {} 
                  try { localStorage.removeItem('josoor_user'); localStorage.setItem('josoor_authenticated','false'); } catch {} 
                  setCurrentUser(null); 
                  navigate('/login'); 
                }}>
                  <span>🚪 {translations.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button onClick={() => { navigate('/login'); }} title={translations.account} className="collapsed-login-button clickable" style={{ width: '32px', height: '32px', border: 'none', padding: 0, cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
              <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Faa1d3e8edf5b47d1b88df2eb208d3cac" alt="profile" style={{ width: '100%', height: '100%', display: 'block' }} />
            </button>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar tajawal-headings cairo-body" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Fixed Top Section */}
      <div className="sidebar-header" style={{ width: "100%", height: "auto", flexGrow: "0", padding: "20px", display: "flex", flexDirection: "column", fontWeight: "400", gap: "6px" }}>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", fontWeight: "400", gap: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", fontWeight: "400" }} />
        </div>

        {/* New Chat Button row with hamburger to its left */}
        <div className="sidebar-header-actions" style={{ display: "flex", alignItems: "center", fontWeight: "400", gap: "8px", justifyContent: "flex-start" }}>
          <button className="sidebar-icon-button clickable" onClick={() => { if (onRequestToggleCollapse) { onRequestToggleCollapse(); } else { setCollapsed(true); } }} title={translations.toggleSidebar} style={{ display: "flex", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0)", height: "40px", justifyContent: "center", width: "40px", willChange: "transform, box-shadow", borderColor: "rgba(0, 0, 0, 0)", font: '400 13px Cairo, "Segoe UI", Roboto, Arial, sans-serif' }}><img src="/icons/menu.svg" alt={translations.toggleSidebar} className="sidebar-quickaction-icon sidebar-quickaction-small" style={{ display: "block", fontWeight: "600", height: "30px", objectFit: "cover", verticalAlign: "middle", width: "30px" }} /></button>

          <div style={{ flexBasis: "0%", flexGrow: "1", fontWeight: "400", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <Button onClick={onNewChat} className="sidebar-newchat-button clickable" variant="default" style={{ display: "flex", alignItems: "center", backgroundColor: "rgb(255, 215, 0)", boxShadow: "rgba(0, 0, 0, 0.08) 0px 1px 2px 0px", color: "rgb(17, 24, 39)", gap: "8px", transitionBehavior: "normal, normal, normal", transitionDelay: "0s, 0s, 0s", transitionDuration: "0.12s, 0.12s, 0.12s", transitionProperty: "transform, filter, box-shadow", transitionTimingFunction: "ease, ease, ease", width: "120px", borderColor: "rgba(0, 0, 0, 0)", borderRadius: "8px", justifyContent: "center", padding: "8px 10px", font: '400 14px Cairo, "Segoe UI", Roboto, Arial, sans-serif' }}>
              <div style={{ display: "block", fontWeight: "400" }}>
                {translations.newChat}
              </div>
            </Button>
          </div>
        </div>

        {/* Quick Actions Section - merged into single Explore JOSOOR block */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
            <div className="sidebar-quickactions-card" style={{ display: "flex", alignItems: "flex-start", backgroundColor: theme === 'light' ? "rgb(248, 250, 252)" : "rgb(31, 41, 55)", boxShadow: "rgb(245, 166, 35) 0.5px 1px 3px 0px", flexDirection: "column", fontWeight: "400", overflowX: "hidden", overflowY: "hidden", padding: "6px 8px", border: theme === 'light' ? "0.8px solid rgb(229, 231, 235)" : "0.8px solid rgb(55, 65, 81)" }}>
              <div className="sidebar-quickactions-title" style={{ fontWeight: "400" }}>
                <div style={{ fontWeight: "400" }}>
                  <div style={{ display: "inline", font: '700 14px/18.2px Tajawal, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', color: theme === 'light' ? "rgb(55, 65, 81)" : undefined }}>{language === 'ar' ? 'استكشف جسور' : 'Explore JOSOOR'}</div>
                </div>
              </div>

              {quickActions.map((action) => {
                const overrideLabel = action.label[language as 'en' | 'ar'] || action.label.en;
                return (
                  <button
                    key={action.id}
                    onClick={() => onQuickAction(action)}
                    className="quickaction-item clickable"
                    title={overrideLabel}
                    aria-label={overrideLabel}
                    data-description={language === 'ar' ? action.label.ar : action.label.en}
                    style={{ display: "flex", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0)", color: theme === 'light' ? "rgb(55, 65, 81)" : "rgb(243, 244, 246)", fontFamily: 'Cairo, "Segoe UI", Roboto, Arial, sans-serif', fontSize: "13px", fontWeight: "400", gap: "8px", padding: "6px 6px", border: "0.8px solid rgba(0, 0, 0, 0)", textAlign: "start" }}
                  >
                    <img src={action.icon} alt={overrideLabel} className="sidebar-quickaction-icon sidebar-quickaction-large" style={{ display: "block", fontWeight: "600", height: "30px", objectFit: "cover", verticalAlign: "middle", width: "30px" }} />
                    <div className="quickaction-meta" style={{ display: "flex", alignItems: "flex-start", flexDirection: "column", fontWeight: "400" }}>
                      <span className="quickaction-title" style={{ display: "block", fontSize: "14px", fontWeight: "400" }}>{overrideLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Conversations Section */}
      {true && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            padding: '0 5px 20px',
            overflowY: 'auto',
          }}
        >
          <div className="conversations-card">
          <button onClick={() => setShowConversations(!showConversations)} className="conversations-header clickable">
            {showConversations ? (
              <img src="/icons/chat.svg" alt="collapse" className="conversations-toggle-icon" />
            ) : (
              <img src="/icons/chat.svg" alt="expand" className="conversations-toggle-icon" />
            )}
            <span className="conversations-title">{translations.conversations}</span>
          </button>

            {showConversations && (
              <div
                style={{
                  marginTop: '4px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  minHeight: 0,
                  overflowY: 'auto',
                }}
              >
                {conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeConversationId}
                    onClick={() => onSelectConversation(conversation.id)}
                    onDelete={() => onDeleteConversation(conversation.id)}
                    formatDate={formatDate}
                    messagesCountLabel={translations.messagesCount(conversation.message_count)}
                    deleteLabel={translations.deleteConversation}
                    isRTL={isRTL}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed Bottom Account Section */}
      <div className="sidebar-account" style={{ height: '80px', padding: '8px' }}>
    {currentUser ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="account-row clickable" style={{ cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'background-color 0.2s' }}>
            <div className="account-avatar" style={{ position: 'relative', background: 'var(--component-color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}>
              <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Faa1d3e8edf5b47d1b88df2eb208d3cac" alt="profile" style={{ width: '100%', height: '100%', display: 'block', color: 'var(--component-text-on-accent)', borderRadius: '50%' }} />
            </div>
            <div className="account-meta" style={{ lineHeight: 1.2, flex: 1, minWidth: 0 }}>
              <p className="account-name" style={{ margin: 0, fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.user_metadata?.full_name || currentUser?.email || translations.account}</p>
              <p className="account-email" style={{ margin: 0, fontSize: '11px', color: 'var(--component-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.email || ''}</p>
            </div>
            <div style={{ color: 'var(--component-text-secondary)' }}>⋮</div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" style={{ width: '240px', backgroundColor: 'var(--component-panel-bg)', color: 'var(--component-text-primary)', border: '1px solid var(--component-panel-border)' }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--component-panel-border)', marginBottom: '4px' }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>{currentUser?.user_metadata?.full_name || translations.account}</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--component-text-secondary)' }}>{currentUser?.email}</p>
          </div>
          <DropdownMenuItem className="clickable" onSelect={(e) => { e.preventDefault(); console.log('Opening Profile'); setIsProfileOpen(true); }}>
            <span>👤 {translations.profile}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="clickable" onSelect={(e) => { e.preventDefault(); console.log('Opening Settings'); setIsSettingsOpen(true); }}>
            <span>⚙️ {language === 'ar' ? 'الإعدادات' : 'Settings'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="clickable" style={{ color: 'var(--component-color-danger)' }} onClick={async () => { 
            try { await authLogout(); } catch {} 
            try { localStorage.removeItem('josoor_user'); localStorage.setItem('josoor_authenticated','false'); } catch {} 
            setCurrentUser(null); 
            navigate('/landing'); 
          }}>
            <span>🚪 {translations.logout}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      ) : (
      <button className="guest-button clickable" style={{ border: '1px solid var(--component-panel-border)' }} onClick={() => {
          try {
            if (isGuestMode()) {
              const guestConvos = getGuestConversations();
              if (guestConvos && guestConvos.length > 0) {
                if (!window.confirm(translations.guestLeaveWarning)) {
                  return;
                }
              }
            }
          } catch (e) {
            // ignore localStorage errors
          }
          navigate('/landing');
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="guest-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(212, 175, 55, 0)', width: '28px', height: '28px' }}>
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Faa1d3e8edf5b47d1b88df2eb208d3cac" alt="profile" style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          <div className="guest-text" style={{ textAlign: isRTL ? 'right' : 'left', lineHeight: 1 }}>
            <p className="guest-mode" style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>{translations.guestMode}</p>
            <p className="login-to-save" style={{ margin: 0, fontSize: '11px', color: 'var(--component-text-secondary)' }}>{translations.loginToSave}</p>
          </div>
        </div>
      </button>
    )}

  </div>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent style={{ maxWidth: '425px', width: '100%' }}>
          <DialogHeader>
            <DialogTitle>{translations.profile}</DialogTitle>
            <DialogDescription>{translations.account}</DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px 0' }}>
            <div style={{ height: '96px', width: '96px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
               <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Faa1d3e8edf5b47d1b88df2eb208d3cac" alt="profile" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{currentUser?.user_metadata?.full_name || currentUser?.email || translations.account}</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{currentUser?.email}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsProfileOpen(false)}>{translations.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent style={{ maxWidth: '425px', width: '100%' }}>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'الإعدادات' : 'Settings'}</DialogTitle>
            <DialogDescription>{language === 'ar' ? 'تخصيص تفضيلات التطبيق الخاص بك.' : 'Customize your application preferences.'}</DialogDescription>
          </DialogHeader>
          <div style={{ display: 'grid', gap: '16px', padding: '16px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', alignItems: 'center', gap: '16px' }}>
              <span style={{ textAlign: 'right', fontWeight: 500 }}>{translations.theme}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  variant={theme === 'light' ? 'default' : 'outline'} 
                  onClick={() => { setTheme('light'); document.documentElement.setAttribute('data-theme', 'light'); }}
                  style={{ flex: 1 }}
                >
                  {translations.light}
                </Button>
                <Button 
                  variant={theme === 'dark' ? 'default' : 'outline'} 
                  onClick={() => { setTheme('dark'); document.documentElement.setAttribute('data-theme', 'dark'); }}
                  style={{ flex: 1 }}
                >
                  {translations.dark}
                </Button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', alignItems: 'center', gap: '16px' }}>
              <span style={{ textAlign: 'right', fontWeight: 500 }}>{translations.language}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  variant={language === 'en' ? 'default' : 'outline'} 
                  onClick={() => setLanguage('en')}
                  style={{ flex: 1 }}
                >
                  {translations.english}
                </Button>
                <Button 
                  variant={language === 'ar' ? 'default' : 'outline'} 
                  onClick={() => setLanguage('ar')}
                  style={{ flex: 1 }}
                >
                  {translations.arabic}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSettingsOpen(false)}>{translations.close}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </aside>
  );
}

interface ConversationItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  formatDate: (date: string) => string;
  messagesCountLabel: string;
  deleteLabel: string;
  isRTL: boolean;
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  formatDate,
  messagesCountLabel,
  deleteLabel,
  isRTL,
}: ConversationItemProps) {
  try {
    // Lightweight debug snapshot to verify data flow from ChatAppPage -> Sidebar
    // This will appear in the browser console. Remove after debugging.
    // eslint-disable-next-line no-console
    console.debug('[Sidebar] ConversationItem render', {
      id: conversation?.id,
      message_count: (conversation as any)?.message_count,
      messages_len: Array.isArray((conversation as any)?.messages) ? (conversation as any).messages.length : undefined,
    });
  } catch (e) {
    // ignore logging errors
  }
  return (
    <div className={`conversation-item clickable ${isActive ? 'conversation-active' : ''}`}>
      <div style={{ flex: 1, minWidth: 0 }} onClick={onClick}>
        <p
          style={{
            fontSize: '12px',
            fontWeight: '500',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: isRTL ? 'right' : 'left',
            color: isActive ? 'var(--component-text-on-accent, rgba(255,255,255,1))' : 'var(--component-text-primary, rgba(26,36,53,1))',
          }}
        >
          {conversation.title}
        </p>
        <div className="conversation-meta">
          <div style={{ display: 'block', fontWeight: '400' }}>{formatDate(conversation.updated_at)}</div>
          <div style={{ display: 'block', fontWeight: '400' }}>•</div>
          <div style={{ display: 'block', fontWeight: '400' }}>{messagesCountLabel}</div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <button
            style={{
              opacity: 0,
              padding: '4px',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0';
            }}
          >
            <span style={{ fontSize: 16, lineHeight: '16px' }}>⋮</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isRTL ? 'start' : 'end'} style={{ backgroundColor: 'var(--component-panel-bg)', color: 'var(--component-text-primary)' }}>
          <DropdownMenuItem
            style={{ color: 'rgb(220, 38, 38)', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <span style={{ fontSize: 16, lineHeight: '16px' }}>🗑️</span>
            <span>{deleteLabel}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
