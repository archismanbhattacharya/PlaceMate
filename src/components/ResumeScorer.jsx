
import React, { useState } from 'react';
import { model } from '../aiConfig';
import { FileText, Briefcase, Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';

const ResumeScorer = () => {
    const [resumeText, setResumeText] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleResumeAnalysis = async () => {
        if (!resumeText.trim() || !targetRole.trim()) return;

        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            const prompt = `
                Act as a Hiring Manager. Review this resume for the role of ${targetRole}. 
                Give a Score out of 100, and list 3 specific improvements.

                RESUME:
                ${resumeText}

                Provide the output in JSON format with the following structure:
                {
                  "score": (number 0-100),
                  "feedback_summary": "Short paragraph from the hiring manager's perspective.",
                  "improvements": ["improvement 1", "improvement 2", "improvement 3"]
                }
                Only return the JSON.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Enhanced cleanup to ensure JSON parsing
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonStartIndex = cleanText.indexOf('{');
            const jsonEndIndex = cleanText.lastIndexOf('}');

            if (jsonStartIndex === -1 || jsonEndIndex === -1) {
                throw new Error("Invalid JSON response from AI");
            }

            const jsonString = cleanText.substring(jsonStartIndex, jsonEndIndex + 1);
            const data = JSON.parse(jsonString);

            setAnalysisResult(data);
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Failed to analyze resume. Please check your API Key configuration.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Resume Scorer</h1>
                <p className="text-muted-foreground">Get expert feedback from an AI Hiring Manager.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-primary" />
                            Target Job Role
                        </label>
                        <input
                            type="text"
                            className="w-full bg-secondary/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="e.g. Software Engineer, Product Manager"
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                        />
                    </div>

                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                        <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Paste Resume Content
                        </label>
                        <textarea
                            className="w-full h-64 bg-secondary/50 rounded-lg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                            placeholder="Paste your full resume text here..."
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                        ></textarea>
                    </div>

                    <button
                        onClick={handleResumeAnalysis}
                        disabled={isAnalyzing || !resumeText || !targetRole}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {isAnalyzing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Analyze Resume
                            </>
                        )}
                    </button>
                </div>

                {/* Results Column */}
                <div className="space-y-4">
                    {analysisResult ? (
                        <div className="bg-card border border-border rounded-xl p-6 shadow-md h-full space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between border-b border-border pb-6">
                                <h2 className="text-xl font-semibold">Hiring Manager's Report</h2>
                                <div className={`text-4xl font-bold ${analysisResult.score >= 80 ? 'text-green-500' :
                                    analysisResult.score >= 50 ? 'text-yellow-500' : 'text-red-500'
                                    }`}>
                                    {analysisResult.score}/100
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Feedback Summary</h3>
                                <p className="leading-relaxed text-sm italic border-l-2 border-primary pl-4 py-1">"{analysisResult.feedback_summary}"</p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Top 3 Improvements</h3>
                                <ul className="space-y-4">
                                    {analysisResult.improvements.map((tip, i) => (
                                        <li key={i} className="flex gap-3 text-sm bg-secondary/30 p-3 rounded-lg">
                                            <div className="mt-0.5">
                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold">
                                                    {i + 1}
                                                </span>
                                            </div>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-10 text-muted-foreground bg-secondary/20">
                            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-center">Enter the target role and resume to receive a professional review.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResumeScorer;
