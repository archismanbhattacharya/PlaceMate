import React, { useState } from 'react';
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
    Sparkles
} from 'lucide-react';

function Dashboard() {
    const [activeTab, setActiveTab] = useState('scorer');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSignOut = () => {
        signOut(auth).catch((error) => console.error("Sign out error", error));
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans selection:bg-primary selection:text-white">

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
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'scorer' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                        <FileText className={`w-5 h-5 ${activeTab === 'scorer' ? 'text-primary' : 'group-hover:text-foreground'}`} />
                        Resume Scorer
                    </button>
                    <button
                        onClick={() => { setActiveTab('interview'); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === 'interview' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                    >
                        <Bot className={`w-5 h-5 ${activeTab === 'interview' ? 'text-primary' : 'group-hover:text-foreground'}`} />
                        Mock Interview
                    </button>
                </nav>

                <div className="absolute bottom-0 w-full p-6 border-t border-border">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                <User className="w-4 h-4" />
                            </div>
                            <span>{auth.currentUser?.displayName || 'Student'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto relative">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
                    <span className="font-bold">PlaceMate AI</span>
                    <button onClick={() => setMobileMenuOpen(true)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 md:p-10 max-w-5xl mx-auto">
                    {activeTab === 'scorer' && <ResumeScorer />}
                    {activeTab === 'interview' && <MockInterview />}
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
