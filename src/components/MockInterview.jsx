import React, { useState, useEffect, useRef } from 'react';
import { model } from '../aiConfig';
import { Send, Mic, MicOff, Play, Square, User, Bot, Volume2, Sparkles, StopCircle } from 'lucide-react';

const MockInterview = () => {
    // State
    const [step, setStep] = useState('setup'); // setup, interview
    const [targetRole, setTargetRole] = useState('');
    const [messages, setMessages] = useState([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Refs
    const chatEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                const transcript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                setCurrentInput(transcript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };
        }
    }, []);

    // Scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const speakText = (text) => {
        if (synthRef.current.speaking) {
            synthRef.current.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
    };

    const stopSpeaking = () => {
        synthRef.current.cancel();
        setIsSpeaking(false);
    };

    const startInterview = async () => {
        if (!targetRole.trim()) return;
        setStep('interview');
        setIsLoading(true);

        // Initial Prompt
        const initialPrompt = `
            Act as a professional Interviewer for the role of "${targetRole}".
            Start by welcoming the candidate and asking the first interview question.
            Keep your response concise (max 2 sentences) and professional.
            Do not provide feedback yet, just start the interview.
        `;

        try {
            const result = await model.generateContent(initialPrompt);
            const response = result.response.text();

            const initialMsg = { role: 'model', text: response };
            setMessages([initialMsg]);
            speakText(response);
        } catch (error) {
            console.error(error);
            setMessages([{ role: 'model', text: "I'm having trouble connecting. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async () => {
        if (!currentInput.trim()) return;

        const userMsg = { role: 'user', text: currentInput };
        setMessages(prev => [...prev, userMsg]);
        setCurrentInput('');
        setIsLoading(true);
        stopSpeaking(); // Stop any previous speech

        try {
            // Context Management
            const history = messages
                .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`)
                .join('\n');

            const prompt = `
                Context:
                ${history}
                
                Candidate: ${userMsg.text}

                Instructions:
                Act as the Interviewer for the ${targetRole} position.
                1. Acknowledge the user's answer briefly.
                2. Ask a follow-up question OR a new relevant question.
                3. Keep it conversational and professional.
                4. Max length: 3 sentences.
            `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            const botMsg = { role: 'model', text: text };
            setMessages(prev => [...prev, botMsg]);
            speakText(text);

        } catch (error) {
            console.error("Analysis failed:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Connection error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] animate-in fade-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                        AI Mock Interview
                    </h1>
                    <p className="text-muted-foreground">Master your interview skills with real-time feedback.</p>
                </div>
                {step === 'interview' && (
                    <button
                        onClick={() => {
                            stopSpeaking();
                            setStep('setup');
                            setMessages([]);
                            setTargetRole('');
                        }}
                        className="text-xs px-3 py-1 bg-secondary hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors font-medium border border-transparent hover:border-destructive/20"
                    >
                        End Session
                    </button>
                )}
            </div>

            {step === 'setup' ? (
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl space-y-6 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bot className="w-10 h-10 text-primary" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">Ready to Practice?</h2>
                            <p className="text-muted-foreground text-sm">Enter the job role you want to interview for.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="text-left">
                                <label className="text-sm font-medium ml-1 mb-1.5 block">Target Role</label>
                                <input
                                    type="text"
                                    className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent hover:border-border"
                                    placeholder="e.g. Product Manager, Data Scientist"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={startInterview}
                                disabled={!targetRole.trim() || isLoading}
                                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Start Interview <Play className="w-4 h-4 fill-current" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col relative">

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 fade-in`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-orange-500 text-white'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                </div>
                                <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm text-sm sm:text-base ${msg.role === 'user'
                                        ? 'bg-primary text-white rounded-tr-none'
                                        : 'bg-secondary/80 text-foreground rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-orange-500" />
                                </div>
                                <div className="bg-secondary/50 rounded-2xl rounded-tl-none px-5 py-4 space-y-2">
                                    <div className="w-12 h-2 bg-foreground/20 rounded-full" />
                                    <div className="w-24 h-2 bg-foreground/20 rounded-full" />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-border bg-background/80 backdrop-blur-md">
                        <div className="max-w-4xl mx-auto flex gap-3 items-end">
                            <button
                                onClick={toggleListening}
                                className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${isListening
                                        ? 'bg-red-500 text-white animate-pulse shadow-red-500/50 shadow-lg'
                                        : 'bg-secondary hover:bg-secondary/80'
                                    }`}
                                title={isListening ? "Stop Listening" : "Start Voice Input"}
                            >
                                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-muted-foreground" />}
                            </button>

                            <div className="flex-1 bg-secondary rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-primary/50 transition-all border border-transparent focus-within:border-primary/20">
                                <input
                                    type="text"
                                    className="flex-1 bg-transparent border-none focus:outline-none py-2 text-sm sm:text-base max-h-32"
                                    placeholder={isListening ? "Listening..." : "Type your answer..."}
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                            </div>

                            <button
                                onClick={handleSend}
                                disabled={!currentInput.trim() || isLoading}
                                className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:scale-95"
                            >
                                <Send className="w-5 h-5 ml-0.5" />
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            {isSpeaking && (
                                <button onClick={stopSpeaking} className="text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1 mx-auto">
                                    <Volume2 className="w-3 h-3 animate-pulse" />
                                    Speaking... Click to mute
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MockInterview;
