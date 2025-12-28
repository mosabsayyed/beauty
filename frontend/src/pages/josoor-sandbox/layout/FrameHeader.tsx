import React, { useState, useEffect } from 'react';
import { Bell, Search, Globe, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getUser, logout as authLogout } from '../../../services/authService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import '../josoor.css';

interface FrameHeaderProps {
    year: string;
    quarter: string;
    onYearChange: (y: string) => void;
    onQuarterChange: (q: string) => void;
    title?: string;
    subtitle?: string;
}

export const FrameHeader: React.FC<FrameHeaderProps> = ({ 
    year, 
    quarter, 
    onYearChange, 
    onQuarterChange,
    title = "Transformation Control Tower",
    subtitle = "Executive Overview & Decision Support"
}) => {
    const navigate = useNavigate();
    const { language, setLanguage, isRTL } = useLanguage();
    const [currentUser, setCurrentUser] = useState<any | null>(() => getUser());
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Re-allocated Sidebar Logic: Theme Management
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

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // Re-allocated Sidebar Logic: User Auth Listener
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

    // ════════════════════════════════════════════════════════════════════
    // ARCHITECTURAL NOTE: DUAL-MODE FILTERING
    // ════════════════════════════════════════════════════════════════════
    // The Year/Quarter filters drive two distinct behaviors depending on the active Desk:
    //
    // 1. Client-Side Slicing (Executives/Control Tower):
    //    The Control Tower fetches a large dataset once (/dashboard-data).
    //    Changes to Year/Quarter trigger a client-side re-filter in children 
    //    (e.g., InternalOutputs.tsx) via useEffect dependencies.
    //    It does NOT re-fetch from the server.
    //
    // 2. Server-Side Querying (Dependency/Risk Desks):
    //    These desks listen to Year/Quarter changes and trigger NEW API calls
    //    (e.g., /api/business-chain/...) to fetch graph data specific to that period.
    //    This is because graph traversals are expensive and time-bound.
    //
    // MAINTENANCE: Ensure both behaviors are tested when modifying this component.
    // ════════════════════════════════════════════════════════════════════
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4', 'All'];
    const years = ['2025', '2026', '2027', '2028', '2029', '2030'];

    // Re-allocated Sidebar Logic: Guest Mode Check
    const isGuest = currentUser ? false : true; // Simplified for this context, but we use authService for actions

    return (
        <div style={{
            height: '70px',
            backgroundColor: '#0B0F19', // Deep Navy
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            zIndex: 90,
            direction: isRTL ? 'rtl' : 'ltr'
        }}>
            {/* Title Section */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ 
                    color: '#fff', 
                    fontSize: '1.25rem', 
                    fontWeight: 700, 
                    margin: 0,
                    letterSpacing: '0.5px'
                }}>
                    {title}
                </h2>
                <div style={{ 
                    color: '#FFD700', 
                    fontSize: '0.75rem', 
                    marginTop: '2px',
                    opacity: 0.8,
                    fontWeight: 500
                }}>
                    {subtitle}
                </div>
            </div>

            {/* COMMAND STRIP: Controls Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                
                {/* 1. Global Filters (Year/Quarter) */}
                <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    backgroundColor: 'rgba(255,255,255,0.03)', 
                    padding: '0.3rem', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <select 
                        value={year} 
                        onChange={(e) => onYearChange(e.target.value)}
                        className="v2-header-select"
                        style={{
                            backgroundColor: 'transparent',
                            color: '#fff',
                            border: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                            padding: '0 0.5rem'
                        }}
                    >
                        {years.map(y => (
                            <option key={y} value={y} style={{color: '#000'}}>{y}</option>
                        ))}
                    </select>
                    <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <select 
                        value={quarter} 
                        onChange={(e) => onQuarterChange(e.target.value)}
                         className="v2-header-select"
                        style={{
                            backgroundColor: 'transparent',
                            color: '#FFD700',
                            border: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                            padding: '0 0.5rem'
                        }}
                    >
                        {quarters.map(q => (
                            <option key={q} value={q} style={{color: '#000'}}>{q}</option>
                        ))}
                    </select>
                </div>

                {/* Vertical Divider */}
                <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

                {/* 2. Global Actions (Share/Export - from Legacy Dashboard) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button className="v2-icon-btn" title="Export Report" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>📥</span>
                        {/* <span style={{ fontSize: '0.8rem' }}>Export</span> */}
                    </button>
                    <button className="v2-icon-btn" title="Share View" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <span style={{ fontSize: '1.2rem' }}>🔗</span>
                        {/* <span style={{ fontSize: '0.8rem' }}>Share</span> */}
                    </button>
                </div>

                 {/* Vertical Divider */}
                 <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

                {/* 3. Appearance & Language (Visible Toggles) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button 
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    <button 
                        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                        style={{ 
                            background: 'rgba(255,255,255,0.1)', 
                            border: 'none', 
                            cursor: 'pointer', 
                            padding: '0.3rem 0.6rem', 
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                        }}
                    >
                        <Globe size={14} />
                        {language === 'ar' ? 'EN' : 'عربي'}
                    </button>
                </div>

                {/* 4. User Profile / Guest Mode (Strict Logic) */}
                <div style={{ paddingLeft: '0.5rem' }}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.8rem', 
                                cursor: 'pointer',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '2rem',
                                backgroundColor: isGuest ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.05)',
                                border: isGuest ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <div style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    borderRadius: '50%', 
                                    background: isGuest ? 'transparent' : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {currentUser?.user_metadata?.avatar_url ? (
                                         <img src={currentUser.user_metadata.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={18} color={isGuest ? '#FFD700' : '#fff'} />
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                                        {currentUser?.user_metadata?.full_name || (isGuest ? (language === 'ar' ? 'ضيف' : 'Guest') : 'User')}
                                    </span>
                                    {isGuest && (
                                        <span style={{ fontSize: '0.65rem', color: '#FFD700', opacity: 0.9 }}>Login to Save</span>
                                    )}
                                </div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" style={{ backgroundColor: '#1F2937', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                             <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{currentUser?.user_metadata?.full_name || (isGuest ? (language === 'ar' ? 'وضع الضيف' : 'Guest Mode') : 'User')}</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#9CA3AF' }}>{currentUser?.email || (isGuest ? 'Local Session' : '')}</p>
                            </div>
                            
                            {isGuest ? (
                                <DropdownMenuItem className="cursor-pointer hover:bg-white/5" onClick={() => navigate('/login')}>
                                    <span style={{ color: '#FFD700', fontWeight: 600 }}>🔐 Login / Sign Up</span>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem className="cursor-pointer hover:bg-white/5 text-red-400" onClick={async () => {
                                    await authLogout();
                                    navigate('/login');
                                }}>
                                    <LogOut size={16} style={{ marginRight: '8px' }} />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

            </div>
        </div>
    );
};
