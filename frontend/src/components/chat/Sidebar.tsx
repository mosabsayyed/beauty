import { useState, useEffect } from 'react';
// Using image assets for sidebar icons (PNG/JPG). Avoiding SVG icon components as requested.
import { ScrollArea } from '../ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import type { ConversationSummary } from '../../types/api';
import type { Language } from '../../types';
import './Sidebar.css';
import { useNavigate } from 'react-router-dom';
import { getUser, logout as authLogout } from '../../services/authService';

interface QuickAction {
  id: string;
  // path to image in public/ (use PNG/JPG). Example: '/logo192.png'
  icon: string;
  label: { en: string; ar: string };
  command: { en: string; ar: string };
  category: 'learn' | 'explore' | 'tools';
}

const quickActions: QuickAction[] = [
  { id: 'first-use-case', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F24ded84f548a48759137635fe832715a', label: { en: 'The First Use Case', ar: 'حالة الاستخدام الأو��ى' }, command: { en: 'Show me the first use case', ar: 'أرني حالة الاستخدام الأولى' }, category: 'learn' },
  { id: 'twin-science', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F61ab7682b3944d1d8c73f4de066443c9', label: { en: 'Twin Science', ar: 'علم ال��وأم' }, command: { en: 'Explain Twin Science', ar: 'اشرح علم التوأم' }, category: 'learn' },
  { id: 'intelligent-dashboards', icon: '/logo192.png', label: { en: 'Intelligent Dashboards', ar: 'لوحات معلومات ذكية' }, command: { en: 'Show intelligent dashboards', ar: 'أرني لوحات المعلومات الذكية' }, category: 'learn' },
  { id: 'chat-over-coffee', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F625aefb2849b4e6c8caff9efe3a65b7b', label: { en: 'Chat Over Coffee', ar: 'محادثة على القهوة' }, command: { en: "Let's chat over coffee", ar: 'لنتحدث على القهوة' }, category: 'explore' },
  { id: 'origins', icon: 'https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2Fc7393ec8891244ef9e3ded3f59c55f3e', label: { en: 'Origins', ar: 'الأصول' }, command: { en: 'Tell me about origins', ar: 'أخبرني عن الأصول' }, category: 'explore' },
  { id: 'twin-experience', icon: '/logo192.png', label: { en: 'Twin Experience', ar: 'تجربة التوأم' }, command: { en: 'Show Twin Experience', ar: 'أرني تجربة التوأم' }, category: 'explore' },
  { id: 'twin-studio', icon: '/logo192.png', label: { en: 'Twin Studio', ar: 'استوديو التوأم' }, command: { en: 'Open Twin Studio', ar: 'افتح استوديو التوأم' }, category: 'tools' },
  { id: 'systems-architecture', icon: '/logo192.png', label: { en: 'Systems Architecture', ar: 'هندسة الأنظمة' }, command: { en: 'Explain systems architecture', ar: 'اشرح هندسة الأنظمة' }, category: 'tools' },
];

const categoryLabels = {
  learn: { en: 'Learn', ar: 'تعلّم' },
  explore: { en: 'Explore', ar: 'استكشف' },
  tools: { en: 'Tools', ar: 'أدوات' },
};

interface SidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: number | null;
  onNewChat: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  onQuickAction: (command: string) => void;
  isCollapsed?: boolean; // optional initial state
  onRequestToggleCollapse?: () => void; // notify parent to toggle sidebar width
  language: Language;
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
  language,
}: SidebarProps) {
  const [showConversations, setShowConversations] = useState(() => conversations.length > 0);
  const [collapsed, setCollapsed] = useState<boolean>(!!isCollapsed);

  useEffect(() => {
    if (conversations.length > 0) setShowConversations(true);
  }, [conversations.length]);

  useEffect(() => {
    // keep collapsed in sync if parent controls it
    setCollapsed(!!isCollapsed);
  }, [isCollapsed]);

  const isRTL = language === 'ar';
  const [currentUser, setCurrentUser] = useState<any | null>(() => getUser());
  const [showProfile, setShowProfile] = useState(false);

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
    guestMode: language === 'ar' ? 'وضع الضي��' : 'Guest Mode',
    loginToSave: language === 'ar' ? 'سجل الدخول للحفظ' : 'Login to save',
    messagesCount: (count: number) => (language === 'ar' ? `${count} رسالة` : `${count} messages`),
    deleteConversation: language === 'ar' ? 'حذف' : 'Delete',
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
    if (diffHours < 24) return language === 'ar' ? `${diffHours} ��` : `${diffHours}h`;
    if (diffDays < 7) return language === 'ar' ? `${diffDays} ي` : `${diffDays}d`;

    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const labelOverrides: Record<string, string | null> = {
    'first-use-case': 'Twin Knowledge',
    'twin-science': 'Demo with Noor',
    'intelligent-dashboards': null,
    'chat-over-coffee': 'Architecture and Features',
    'origins': 'Approach and UC001',
    'twin-experience': null,
    'twin-studio': null,
    'systems-architecture': null,
  };

  const categories = ['learn', 'explore'] as const;

  // Icons sequence for collapsed view (logos only) — exclude login (rendered at bottom)
  const collapsedIconSequence: { id: string; src: string; alt: string; onClick?: () => void }[] = [
    // Black box with J (app logo placeholder; rendered specially)
    { id: 'logo', src: '/logo192.png', alt: 'JOSOOR' },
    // Hamburger (toggle)
    { id: 'hamburger', src: '', alt: 'Toggle' },
    // Twin Knowledge (first-use-case)
    { id: 'first-use-case', src: quickActions.find((q) => q.id === 'first-use-case')?.icon || '/logo192.png', alt: 'Twin Knowledge', onClick: () => onQuickAction((quickActions.find((q) => q.id === 'first-use-case')?.command || { en: '' }).en) },
    // Demo with Noor
    { id: 'twin-science', src: quickActions.find((q) => q.id === 'twin-science')?.icon || '/logo192.png', alt: 'Demo with Noor', onClick: () => onQuickAction((quickActions.find((q) => q.id === 'twin-science')?.command || { en: '' }).en) },
    // Architecture
    { id: 'chat-over-coffee', src: quickActions.find((q) => q.id === 'chat-over-coffee')?.icon || '/logo192.png', alt: 'Architecture', onClick: () => onQuickAction((quickActions.find((q) => q.id === 'chat-over-coffee')?.command || { en: '' }).en) },
    // Approach
    { id: 'origins', src: quickActions.find((q) => q.id === 'origins')?.icon || '/logo192.png', alt: 'Approach', onClick: () => onQuickAction((quickActions.find((q) => q.id === 'origins')?.command || { en: '' }).en) },
    // Conversations icon (reuse collapse image)
    { id: 'conversations', src: 'https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F07de9d8efdc441be8374d494e265c8d3', alt: 'Conversations', onClick: () => setShowConversations((s) => !s) },
  ];

  // If collapsed, render thin icon-only sidebar with top group and bottom login fixed
  if (collapsed) {
    return (
      <aside
        style={{
          width: '64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '8px 6px',
          gap: 12,
          backgroundColor: 'rgb(255,255,255)',
          borderRight: '0.8px solid rgb(229,231,235)',
          height: '100%',
          boxShadow: 'rgba(0,0,0,0.04) 2px 0px 8px 0px',
          position: 'relative',
          zIndex: 30,
        }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {collapsedIconSequence.map((item) => {
            if (item.id === 'hamburger') {
              return (
                <button
                  key={item.id}
                  onClick={() => { if (onRequestToggleCollapse) { onRequestToggleCollapse(); } else { setCollapsed(false); } }}
                  title={item.alt}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F8943a0e6569a48b6be2490eb6f9c1034" alt={item.alt} className="sidebar-quickaction-icon" />
                </button>
              );
            }

            if (item.id === 'logo') {
              // render black box with white J
              return (
                <div key={item.id} style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>J</span>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => item.onClick?.()}
                title={item.alt}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <img src={item.src} alt={item.alt} className="sidebar-quickaction-icon" />
              </button>
            );
          })}
        </div>

        {/* Login at bottom - gold circle */}
        <div style={{ paddingBottom: 8 }}>
          <button
            onClick={() => { navigate('/login'); }}
            title="Account"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 16 }}>👤</span>
            </div>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '280px',
        backgroundColor: 'rgb(255, 255, 255)',
        borderRight: '0.8px solid rgb(229, 231, 235)',
        boxShadow: 'rgba(0, 0, 0, 0.04) 2px 0px 8px 0px',
        transitionDuration: '0.3s',
        position: 'relative',
        zIndex: 30,
        overflow: 'hidden',
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Fixed Top Section */}
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              width: '100%',
              borderRadius: '5px',
              backgroundColor: 'rgba(0, 0, 0, 1)',
              color: 'rgba(255, 255, 255, 1)',
              textAlign: 'center',
              overflow: 'hidden',
              boxShadow: '1px 1px 3px 0px rgba(0, 0, 0, 1)',
              marginBottom: '5px',
              padding: '5px 0',
            }}
          >
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '600',
                lineHeight: '31.2px',
                margin: 0,
                padding: '0 16px',
                color: 'rgba(255, 255, 255, 1)',
              }}
            >
              {translations.appName}
            </h1>
          </div>
        </div>

        {/* New Chat Button row with hamburger to its left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Hamburger inside sidebar */}
          <button
            onClick={() => { if (onRequestToggleCollapse) { onRequestToggleCollapse(); } else { setCollapsed(true); } }}
            title="Toggle sidebar"
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F8943a0e6569a48b6be2490eb6f9c1034" alt="Toggle sidebar" className="sidebar-quickaction-icon" />
          </button>

          {/* Reduced New Chat */}
          <div style={{ flex: 1 }}>
            <Button onClick={onNewChat} style={{ width: '100%', padding: '8px 10px', fontSize: 14 }} variant="default">
              <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F99ca5bf048b1493e9a7cd183b2487fe4" alt="new chat" style={{ marginRight: 8 }} className="sidebar-newchat-icon" />
              <span style={{ fontSize: 14 }}>{translations.newChat}</span>
            </Button>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '12px' }}>
            {categories.map((category) => {
              const categoryActions = quickActions.filter((a) => a.category === category);
              const actionsToShow = categoryActions.filter((a) => labelOverrides[a.id] !== null);

              return (
                <div
                  key={category}
                  className="sidebar-quickactions-card"
                  style={{
                    borderRadius: '5px',
                    border: '0.8px solid rgb(155, 155, 155)',
                    backgroundColor: 'rgba(0, 0, 0, 1)',
                    boxShadow: '0.5px 1px 3px 0 rgba(245, 166, 35, 1)',
                    padding: '5px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 1)',
                      margin: 0,
                    }}
                  >
                    {category === 'learn' ? (
                      <h2 style={{ display: 'inline', fontSize: '14px', fontWeight: 900, margin: 0 }}><span style={{ color: 'rgb(255, 255, 255)', fontFamily: 'IBM Plex Sans, sans-serif' }}>Explore Twin Life</span></h2>
                    ) : category === 'explore' ? (
                      <h2 style={{ display: 'inline', fontSize: '14px', fontWeight: 900, margin: 0 }}><span style={{ color: 'rgb(255, 255, 255)', fontFamily: '__Inter_d65c78, sans-serif' }}>Explore JOSOOR</span></h2>
                    ) : (
                      <span style={{ display: 'inline', fontWeight: 900, fontSize: '16px' }}>{categoryLabels[category][language]}</span>
                    )}
                  </div>

                  {actionsToShow.map((action) => {
                    const overrideLabel = labelOverrides[action.id] ?? action.label[language];
                    const itemFontSize = category === 'learn' || category === 'explore' ? '12px' : '14px';

                    return (
                      <button
                        key={action.id}
                        onClick={() => onQuickAction(action.command[language])}
                        style={{
                          width: '100%',
                          display: 'inline-block',
                          borderColor: 'rgb(0, 0, 0)',
                          fontFamily: 'Arial',
                          fontWeight: '600',
                          backgroundColor: 'rgba(0, 0, 0, 0)',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: isRTL ? 'right' : 'left',
                          fontSize: '14px',
                          padding: 0,
                          marginRight: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <img src={action.icon} alt="icon" className="sidebar-quickaction-icon" />
                        <span style={{ fontWeight: 'normal', fontSize: itemFontSize }}><span style={{ color: 'rgb(255, 255, 255)' }}><font face="IBM Plex Sans, sans-serif">{overrideLabel}</font></span></span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
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
          <div
            style={{
              borderRadius: '5px',
              border: '1.6px solid rgb(155, 155, 155)',
              backgroundColor: 'rgba(155, 155, 155, 1)',
              boxShadow: '1px 1px 3px 0px rgba(0, 0, 0, 1)',
              margin: '0 10px 0 20px',
              padding: '5px 10px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              color: 'rgba(0, 0, 0, 1)',
            }}
          >
            <button
              onClick={() => setShowConversations(!showConversations)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '14px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 1)',
                marginBottom: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <span style={{ color: 'rgb(255, 255, 255)', fontSize: '18px' }}>{translations.conversations}</span>
              {showConversations ? (
                <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F07de9d8efdc441be8374d494e265c8d3" alt="collapse" style={{ width: '35px' }} />
              ) : (
                <img src="https://cdn.builder.io/api/v1/image/assets%2Fc88de0889c4545b98ff911f5842e062a%2F07de9d8efdc441be8374d494e265c8d3" alt="expand" style={{ width: '35px' }} />
              )}
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
      <div
        style={{
          borderTop: '1px solid rgba(155, 155, 155, 1)',
          padding: '12px 20px',
          flexShrink: 0,
        }}
      >
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div onClick={() => { console.debug('Sidebar: avatar clicked, opening profile'); setShowProfile(true); }} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(229, 231, 235, 1)' }}>
                <span style={{ color: '#fff', fontWeight: 700 }}>👤</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{currentUser?.email || currentUser?.user_metadata?.full_name || 'Account'}</p>
                <p style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 1)', margin: 0 }}>{currentUser?.email || ''}</p>
              </div>
            </div>

            <div>
              <button onClick={() => { console.debug('Sidebar: menu button clicked, opening profile'); setShowProfile(true); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 6 }} aria-label="Account menu">⋯</button>
            </div>
          </div>
        ) : (
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onClick={() => { navigate('/login'); }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#D4AF37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(229, 231, 235, 1)',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700 }}>👤</span>
            </div>
            <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', margin: 0 }}>{translations.guestMode}</p>
              <p style={{ fontSize: '12px', color: 'rgba(107, 114, 128, 1)', margin: 0 }}>{translations.loginToSave}</p>
            </div>
          </button>
        )}
      </div>

      {showProfile && (
        <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={() => setShowProfile(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{ background: '#fff', borderRadius: 8, padding: 20, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 1001 }}>
            <h3 style={{ marginTop: 0 }}>Profile</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{currentUser?.user_metadata?.full_name || currentUser?.email || 'Account'}</div>
                <div style={{ color: 'rgba(107,114,128,1)', fontSize: 13 }}>{currentUser?.email || ''}</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <button onClick={async () => { try { await authLogout(); } catch {} try { localStorage.removeItem('josoor_user'); localStorage.setItem('josoor_authenticated','false'); } catch {} setShowProfile(false); setCurrentUser(null); navigate('/login'); }} style={{ padding: '8px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Logout</button>
              <button onClick={() => setShowProfile(false)} style={{ marginLeft: 8, padding: '8px 12px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

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
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: isActive ? 'rgba(26, 36, 53, 1)' : 'rgba(255, 255, 255, 1)',
        color: isActive ? 'rgba(255, 255, 255, 1)' : 'rgba(26, 36, 53, 1)',
      }}
    >
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
            color: isActive ? 'rgba(255, 255, 255, 1)' : 'rgba(26, 36, 53, 1)',
          }}
        >
          {conversation.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', lineHeight: '18px', backgroundColor: isActive ? 'transparent' : 'rgba(255, 255, 255, 1)', color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(26, 36, 53, 1)' }}>
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
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
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
        <DropdownMenuContent align={isRTL ? 'start' : 'end'} style={{ backgroundColor: 'white', color: 'black' }}>
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
