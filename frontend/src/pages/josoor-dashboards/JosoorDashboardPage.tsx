import React, { useState } from 'react';
import './JosoorDashboard.css';
import { Mic, Send, X, Globe } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { useLanguage } from '../../contexts/LanguageContext';

// Import views
import ControlTower from './ControlTower';
import DependencyDesk from './DependencyDesk';
import RiskDesk from './RiskDesk';
import ArchitectureRedesigned from '../../components/ArchitectureRedesigned';
import ChatAppPage from '../ChatAppPage';
import { ObservabilityDashboard } from '../ObservabilityPage';

// Define types locally or import (assuming they are not exported elsewhere)
type Lens = 'Maestro' | 'Noor';
type ViewMode = 'control-tower' | 'dependencies' | 'risks' | 'graph' | 'conversations' | 'observability';

const JosoorDashboardPage: React.FC = () => {
  const { language, setLanguage, isRTL } = useLanguage();
  const [activeLens, setActiveLens] = useState<Lens>('Maestro');
  
  // Flattened view state for simpler navigation
  const [activeView, setActiveView] = useState<string>('control-tower');
  
  const [inputValue, setInputValue] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  // Sidebar items - simple flat list matching the tabs concept
  const sidebarItems = [
    { id: 'control-tower', label: language === 'ar' ? 'برج التحكم' : 'Control Tower', view: 'control-tower' },
    { id: 'dependencies', label: language === 'ar' ? 'مكتب الاعتماديات' : 'Dependency Desk', view: 'dependencies' },
    { id: 'risks', label: language === 'ar' ? 'مكتب المخاطر' : 'Risk Desk', view: 'risks' },
    { id: 'graph', label: language === 'ar' ? 'المخطط الهيكلي' : 'Architecture Graph', view: 'graph' },
    { id: 'conversations', label: language === 'ar' ? 'المحادثات' : 'Conversations', view: 'conversations' },
    { id: 'observability', label: language === 'ar' ? 'مراقبة النظام' : 'Observability', view: 'observability' }, 
  ];

  const handleNavClick = (item: any) => {
    setActiveView(item.view);
  };
  
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Add user message immediately
    const userText = inputValue;
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputValue('');
    setChatOpen(true);
    setIsChatLoading(true);

    try {
        const response = await chatService.sendMessage({
            query: userText,
            conversation_id: activeConversationId || undefined,
            push_to_graph_server: false 
        });

        // Store active conversation ID if new
        if (response.conversation_id) {
            setActiveConversationId(response.conversation_id);
        }

        // Parse response content
        let content = '';
        if (response.llm_payload) {
             const payload = response.llm_payload;
             content = payload.answer || payload.message || payload.thought || JSON.stringify(payload);
        } else {
            content = response.message || response.answer || JSON.stringify(response);
        }

        setChatMessages(prev => [...prev, { role: 'assistant', text: content }]);

    } catch (error) {
        console.error("Chat failed", error);
        setChatMessages(prev => [...prev, { role: 'assistant', text: "Error connecting to JOSOOR AI. Please check backend connection." }]);
    } finally {
        setIsChatLoading(false);
    }
  };

  return (
    <div className="josoor-dashboard">
      {/* Sidebar */}
      <aside className="jd-sidebar">
        <div className="jd-logo">JOSOOR</div>
        <div className="jd-logo-sub">
            Transformation OS
            <br />
            <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>v10.4.2 (Stable)</span>
        </div>
        <nav>
          {sidebarItems.map(item => (
            <div 
              key={item.id} 
              className={`jd-nav-item ${activeView === item.view ? 'active' : ''}`}
              onClick={() => handleNavClick(item)}
              style={{ cursor: 'pointer' }}
            >
              {item.label}
            </div>
          ))}
        </nav>

        {/* Lens Selection */}
        <div className="jd-lens-selector">
          <div className="jd-lens-label">LENS</div>
          <div className="jd-lens-options">
            <button 
              className={`jd-lens-btn ${activeLens === 'Maestro' ? 'active' : ''}`}
              onClick={() => setActiveLens('Maestro')}
            >
              Maestro
            </button>
            <button 
              className={`jd-lens-btn ${activeLens === 'Noor' ? 'active' : ''}`}
              onClick={() => setActiveLens('Noor')}
            >
              Noor
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="jd-main">
        {/* Header */}
        <header className="jd-header">
          <div className="jd-page-title">
            {activeView === 'control-tower' && (language === 'ar' ? 'برج التحكم' : 'Control Tower')}
            {activeView === 'dependencies' && (language === 'ar' ? 'مكتب الاعتماديات' : 'Dependency Desk')}
            {activeView === 'risks' && (language === 'ar' ? 'مكتب المخاطر' : 'Risk Desk')}
            {activeView === 'graph' && (language === 'ar' ? 'المخطط الهيكلي' : 'Architecture Graph')}
            {activeView === 'conversations' && (language === 'ar' ? 'المحادثات' : 'Conversations')}
            {activeView === 'observability' && (language === 'ar' ? 'مراقبة النظام' : 'System Observability')}
          </div>
          <div className="jd-header-roles">
            {/* Language Toggle */}
            <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                style={{ 
                    background: 'transparent', 
                    border: '1px solid var(--jd-card-border)', 
                    color: 'var(--text-secondary)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    marginRight: '1rem',
                    marginLeft: '1rem'
                }}
            >
                <Globe size={14} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{language === 'en' ? 'AR' : 'EN'}</span>
            </button>

            <div className="jd-role-badge">
              <span className="dot online"></span>
              Stakeholder Liaison
            </div>
            <div className="jd-role-badge">
              <span className="dot busy"></span>
              Dependency Architect
            </div>
          </div>
        </header>

        {/* Tab Navigation Removed - Sidebar is primary */}

        {/* Content View */}
        <div className="jd-content-area" style={{ position: 'relative', height: activeView === 'conversations' || activeView === 'observability' ? 'calc(100vh - 80px)' : 'auto' }}>
          {activeView === 'control-tower' && <ControlTower />}
          {activeView === 'dependencies' && <DependencyDesk />}
          {activeView === 'risks' && <RiskDesk />}
          
          {/* Real Components replacing placeholders */}
          {activeView === 'graph' && (
              <div style={{ height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
                  <ArchitectureRedesigned />
              </div>
          )}
          
          {activeView === 'conversations' && (
              <div style={{ height: '100%', overflow: 'hidden' }}>
                  <ChatAppPage />
              </div>
          )}
          
          {activeView === 'observability' && (
              <div style={{ height: '100%', overflow: 'hidden' }}>
                  <ObservabilityDashboard showHeader={false} />
              </div>
          )}

          {/* Chat Output Drawer (Only visible on Desks/Graph) */}
          {chatOpen && !['conversations'].includes(activeView) && (
            <div className="chat-drawer" style={{
                position: 'absolute',
                bottom: 0,
                right: '2rem',
                width: '400px',
                height: '500px',
                background: 'var(--jd-card-bg)',
                border: '1px solid var(--jd-card-border)',
                borderBottom: 'none',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
                zIndex: 50
            }}>
                <div className="chat-drawer-header" style={{ padding: '1rem', borderBottom: '1px solid var(--jd-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#fff' }}>JOSOOR AI Assistant</span>
                    <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div className="chat-drawer-body" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    {chatMessages.map((msg, i) => (
                        <div key={i} style={{ marginBottom: '1rem', textAlign: msg.role === 'user' ? (isRTL ? 'left' : 'right') : (isRTL ? 'right' : 'left') }}>
                            <div style={{ 
                                display: 'inline-block', 
                                padding: '0.75rem 1rem', 
                                borderRadius: '12px', 
                                background: msg.role === 'user' ? 'var(--jd-accent)' : 'rgba(255,255,255,0.1)',
                                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                                maxWidth: '90%',
                                fontSize: '0.9rem'
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (
                         <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            <div style={{ display: 'inline-block', padding: '0.5rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                JOSOOR is thinking...
                            </div>
                         </div>
                    )}
                    {chatMessages.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'center', marginTop: '2rem' }}>
                        {language === 'ar' ? 'اسأل أي سؤال عن لوحة المعلومات...' : 'Ask a question about the dashboard...'}
                    </div>}
                </div>
            </div>
          )}
        </div>

        {/* Footer Chat (Hidden on Conversations view as it has its own input) */}
        {!['conversations'].includes(activeView) && (
        <footer className="jd-footer-chat">
            <form onSubmit={handleChatSubmit} style={{ width: '100%', maxWidth: '800px', position: 'relative' }}>
                <input 
                    type="text" 
                    className="chat-input"
                    placeholder={language === 'ar' ? "اسأل أسئلة محددة (مثل: ما الذي يعيق P-17؟)" : "Ask specific questions (e.g., 'What is blocking P-17?')"}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    style={{ paddingRight: '90px' }}
                />
                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px' }}>
                    <button type="button" className="chat-icon-btn"><Mic size={18} /></button>
                    <button type="submit" className="chat-icon-btn active"><Send size={18} /></button>
                </div>
            </form>
        </footer>
        )}
      </main>
    </div>
  );
};

export default JosoorDashboardPage;
