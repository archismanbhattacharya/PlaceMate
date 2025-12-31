import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import ResumeScorer from './ResumeScorer';
import MockInterview from './MockInterview';
import {
    Bot,
    FileText,
    User,
    Menu,
    X,
    LogOut,
    Sparkles,
    Sun,
    Moon
} from 'lucide-react';

function Dashboard() {
    const [activeTab, setActiveTab] = useState('scorer');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Theme Management
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') ||
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleSignOut = () => {
        signOut(auth).catch((error) => console.error("Sign out error", error));
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans selection:bg-primary selection:text-white transition-colors duration-300">

            {/* Sidebar Navigation */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">
                        <Sparkles className="w-6 h-6 text-primary" />
                        PlaceMate AI
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    <button
                        onClick={() => { setActiveTab('scorer'); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'scorer' ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                        <FileText className={`w-5 h-5 ${activeTab === 'scorer' ? 'text-primary' : 'group-hover:text-foreground'}`} />
                        Resume Scorer
                    </button>
                    <button
                        onClick={() => { setActiveTab('interview'); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'interview' ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                        <Bot className={`w-5 h-5 ${activeTab === 'interview' ? 'text-primary' : 'group-hover:text-foreground'}`} />
                        Mock Interview
                    </button>
                </nav>

                <div className="absolute bottom-0 w-full p-6 border-t border-border space-y-4">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-sm transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </span>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="truncate">{auth.currentUser?.displayName || 'Student'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto relative bg-background/50">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
                    <span className="font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" /> PlaceMate AI
                    </span>
                    <button onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-4 md:p-10 max-w-6xl mx-auto animate-in fade-in duration-500">
                    {activeTab === 'scorer' && <ResumeScorer />}
                    {activeTab === 'interview' && <MockInterview />}
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
