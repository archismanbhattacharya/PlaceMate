import React, { useState, useEffect, useRef } from 'react';
import { model } from '../aiConfig';
import { Send } from 'lucide-react';

const MockInterview = () => {
    const [chatMessages, setChatMessages] = useState([
        { role: 'model', text: "Hello! I'm your sophisticated interview coach. I can help you prepare for your upcoming interviews. Tell me a bit about the role you're applying for, or we can start with general behavioral questions." }
    ]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isChatting, setIsChatting] = useState(false);
    const chatEndRef = useRef(null);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSendMessage = async () => {
        if (!currentMessage.trim()) return;

        const newUserMsg = { role: 'user', text: currentMessage };
        setChatMessages(prev => [...prev, newUserMsg]);
        setCurrentMessage('');
        setIsChatting(true);

        try {
            // Filter out the initial welcome message if it's from the model and first
            const apiHistory = chatMessages
                .filter((msg, index) => !(index === 0 && msg.role === 'model'))
                .map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                }));

            const chat = model.startChat({
                history: apiHistory,
                generationConfig: {
                    maxOutputTokens: 500,
                },
            });

            const result = await chat.sendMessage(currentMessage);
            const response = await result.response;
            const text = response.text();

            setChatMessages(prev => [...prev, { role: 'model', text: text }]);
        } catch (error) {
            console.error("Chat failed:", error);
            setChatMessages(prev => [...prev, { role: 'model', text: "I encountered an error. Please check your connection or API key." }]);
        } finally {
            setIsChatting(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Mock Interview</h1>
                <p className="text-muted-foreground">Practice answering questions with an AI coach.</p>
            </div>

            <div className="flex-1 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-secondary text-secondary-foreground rounded-bl-none'
                                }`}>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
                    <div className="flex gap-4 max-w-3xl mx-auto">
                        <input
                            type="text"
                            className="flex-1 bg-secondary rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="Type your answer..."
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isChatting}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!currentMessage.trim() || isChatting}
                            className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-50 disabled:scale-95"
                        >
                            {isChatting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockInterview;
