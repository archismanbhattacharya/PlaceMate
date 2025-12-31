import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, ArrowRight, Bot, FileText, Zap } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Failed to sign in with Google. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex text-foreground font-sans selection:bg-primary selection:text-white overflow-hidden relative">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />

            <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center p-6 gap-12 lg:gap-24">

                {/* Left Column: Intro & Value Prop */}
                <div className="lg:w-1/2 space-y-8 animate-in slide-in-from-left-8 fade-in duration-700">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/20">
                            <Sparkles className="w-3 h-3" />
                            AI-Powered Career Accelerator
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                            Land Your Dream Job <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Faster & Smarter.</span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                            Stop guessing what recruiters want. PlaceMate AI optimizes your resume in seconds and preps you with realistic mock interviews tailored to your target role.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
                            <FileText className="w-8 h-8 text-primary mb-3" />
                            <h3 className="font-semibold mb-1">Smart Resume Scoring</h3>
                            <p className="text-sm text-muted-foreground">Get instant score & actionable fix list.</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-card/50 border border-border backdrop-blur-sm">
                            <Bot className="w-8 h-8 text-primary mb-3" />
                            <h3 className="font-semibold mb-1">AI Mock Interviews</h3>
                            <p className="text-sm text-muted-foreground">Practice via voice with a virtual coach.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 text-sm font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Powered by Gemini 1.5 Flash</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>ATS-Friendly Analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Real-time Feedback</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Login Card */}
                <div className="lg:w-1/2 w-full max-w-md animate-in slide-in-from-right-8 fade-in duration-700 delay-200">
                    <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden relative group">
                        {/* Decorative blur */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-500" />

                        <div className="p-8 lg:p-10 space-y-8 relative z-10">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 group-hover:rotate-6 transition-transform">
                                    <Zap className="w-8 h-8 text-primary fill-primary" />
                                </div>
                                <h2 className="text-2xl font-bold">Welcome to PlaceMate</h2>
                                <p className="text-sm text-muted-foreground">Sign in to unlock your personal AI career coach.</p>
                            </div>

                            {error && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm text-center font-medium animate-in shake">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoggingIn}
                                className="w-full py-4 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoggingIn ? (
                                    <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                )}
                                <span>Continue with Google</span>
                                <ArrowRight className="w-4 h-4 opacity-50" />
                            </button>

                            <div className="text-center">
                                <p className="text-xs text-muted-foreground px-8">
                                    By clicking continue, you agree to our <a href="#" className="underline hover:text-foreground">Terms</a> and <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
