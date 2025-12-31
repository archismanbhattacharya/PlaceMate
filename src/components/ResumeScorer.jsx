import React, { useState, useCallback, useEffect } from 'react';
import { model } from '../aiConfig';
import { FileText, Briefcase, Sparkles, CheckCircle, AlertTriangle, Upload, X, Loader2, ChevronRight, TrendingUp } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Circular Progress Component
const ScoreGauge = ({ score }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    // Color logic
    const getColor = (s) => {
        if (s >= 80) return 'text-green-500';
        if (s >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    className="text-secondary"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="64"
                    cy="64"
                />
                <circle
                    className={`transition-all duration-1000 ease-out ${getColor(score)}`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="64"
                    cy="64"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`text-3xl font-bold ${getColor(score)}`}>{score}</span>
                <span className="text-xs text-muted-foreground">/100</span>
            </div>
        </div>
    );
};

// Loading Skeleton Component
const ResultSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between border-b border-border pb-6">
            <div className="h-6 w-40 bg-secondary rounded"></div>
            <div className="h-16 w-16 bg-secondary rounded-full"></div>
        </div>
        <div className="space-y-3">
            <div className="h-4 w-24 bg-secondary rounded"></div>
            <div className="h-20 w-full bg-secondary rounded"></div>
        </div>
        <div className="space-y-3">
            <div className="h-4 w-32 bg-secondary rounded"></div>
            <div className="h-12 w-full bg-secondary rounded"></div>
            <div className="h-12 w-full bg-secondary rounded"></div>
            <div className="h-12 w-full bg-secondary rounded"></div>
        </div>
    </div>
);

const ResumeScorer = () => {
    const [resumeText, setResumeText] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [fileName, setFileName] = useState('');
    const [fileError, setFileError] = useState('');
    const [loadingText, setLoadingText] = useState('Analyzing Resume...');

    const loadingMessages = [
        "Reading document structure...",
        "Identifying key skills...",
        "Comparing with job requirements...",
        "Generating improvements...",
        "Finalizing score..."
    ];

    useEffect(() => {
        let interval;
        if (isAnalyzing) {
            let i = 0;
            interval = setInterval(() => {
                setLoadingText(loadingMessages[i % loadingMessages.length]);
                i++;
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [isAnalyzing]);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setFileName(file.name);
        setFileError('');
        setResumeText('');

        try {
            if (file.type === 'text/plain') {
                const text = await file.text();
                setResumeText(text);
            } else if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                setResumeText(fullText);
            } else if (
                file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                file.name.endsWith('.docx')
            ) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                setResumeText(result.value);
            } else {
                setFileError('Unsupported file type. Please upload PDF, DOCX, or TXT.');
                setFileName('');
            }
        } catch (error) {
            console.error('Error reading file:', error);
            setFileError('Failed to read file. Please try again or paste text manually.');
            setFileName('');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1
    });

    const clearFile = () => {
        setFileName('');
        setResumeText('');
        setFileError('');
        setAnalysisResult(null);
    };

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
                  "improvements": [
                    {"title": "Improvement Title", "detail": "Detailed explanation..."},
                    {"title": "Improvement Title", "detail": "Detailed explanation..."},
                    {"title": "Improvement Title", "detail": "Detailed explanation..."}
                  ]
                }
                Only return the JSON.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Enhanced cleanup
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonStartIndex = cleanText.indexOf('{');
            const jsonEndIndex = cleanText.lastIndexOf('}');

            if (jsonStartIndex === -1 || jsonEndIndex === -1) throw new Error("Invalid JSON");

            const jsonString = cleanText.substring(jsonStartIndex, jsonEndIndex + 1);
            let data = JSON.parse(jsonString);

            // Backward compatibility for array of strings if AI messes up schema
            if (data.improvements && typeof data.improvements[0] === 'string') {
                data.improvements = data.improvements.map(imp => ({ title: "Suggestion", detail: imp }));
            }

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                        Resume Scorer
                    </h1>
                    <p className="text-muted-foreground mt-1">AI-powered hiring feedback engine</p>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs font-medium px-3 py-1 bg-secondary rounded-full text-muted-foreground">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    Powered by Gemini 1.5 Flash
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <label className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                            <Briefcase className="w-4 h-4 text-primary" />
                            Target Job Title
                        </label>
                        <input
                            type="text"
                            className="w-full bg-secondary/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent hover:border-border"
                            placeholder="e.g. Senior Frontend Engineer"
                            value={targetRole}
                            onChange={(e) => setTargetRole(e.target.value)}
                        />
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <label className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                            <FileText className="w-4 h-4 text-primary" />
                            Resume Document
                        </label>

                        {!fileName ? (
                            <div
                                {...getRootProps()}
                                className={`group border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="w-8 h-8 text-primary" />
                                </div>
                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground mt-2">Supports PDF, DOCX, TXT</p>
                            </div>
                        ) : (
                            <div className="h-64 bg-green-500/10 border border-green-500/20 rounded-xl p-6 flex flex-col items-center justify-center relative animate-in fade-in zoom-in-95">
                                <button
                                    onClick={clearFile}
                                    className="absolute top-3 right-3 p-1.5 hover:bg-background/50 rounded-full text-muted-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-3 shadow-sm">
                                    <FileText className="w-8 h-8 text-green-600" />
                                </div>
                                <p className="font-semibold text-sm truncate max-w-full px-8 text-center">{fileName}</p>
                                <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Ready for Analysis
                                </p>
                            </div>
                        )}

                        {fileError && (
                            <div className="mt-3 text-red-500 text-xs flex items-center gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {fileError}
                            </div>
                        )}

                        <div className="mt-4">
                            <details className="text-xs text-muted-foreground group">
                                <summary className="cursor-pointer hover:text-primary list-none flex items-center gap-1">
                                    <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                                    Or paste text manually
                                </summary>
                                <textarea
                                    className="w-full h-32 bg-secondary/50 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mt-2 border border-transparent hover:border-border transition-all"
                                    placeholder="Paste raw resume text here..."
                                    value={resumeText}
                                    onChange={(e) => {
                                        setResumeText(e.target.value);
                                        setFileName('');
                                    }}
                                ></textarea>
                            </details>
                        </div>
                    </div>

                    <button
                        onClick={handleResumeAnalysis}
                        disabled={isAnalyzing || !resumeText || !targetRole}
                        className="w-full py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {loadingText}
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Generate Report
                            </>
                        )}
                    </button>
                </div>

                {/* Results Column */}
                <div className="relative">
                    {/* Background decoration */}
                    {!analysisResult && !isAnalyzing && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                            <Sparkles className="w-64 h-64" />
                        </div>
                    )}

                    {isAnalyzing ? (
                        <div className="bg-card border border-border rounded-xl p-8 shadow-md h-full">
                            <ResultSkeleton />
                        </div>
                    ) : analysisResult ? (
                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xl animate-in slide-in-from-right-4 duration-500 flex flex-col h-full">

                            {/* Header / Score */}
                            <div className="p-8 pb-6 border-b border-border bg-secondary/20 flex flex-col items-center sm:flex-row sm:justify-between gap-6">
                                <div>
                                    <h2 className="text-xl font-bold mb-1">Analysis Report</h2>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        target: <span className="font-medium text-foreground">{targetRole}</span>
                                    </p>
                                </div>
                                <ScoreGauge score={analysisResult.score} />
                            </div>

                            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                                {/* Summary */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" />
                                        Executive Summary
                                    </h3>
                                    <div className="bg-secondary/30 p-4 rounded-xl text-sm leading-relaxed border-l-4 border-primary">
                                        {analysisResult.feedback_summary}
                                    </div>
                                </div>

                                {/* Improvements */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Recommended Improvements
                                    </h3>
                                    <div className="grid gap-4">
                                        {analysisResult.improvements.map((item, i) => (
                                            <div key={i} className="group bg-background border border-border hover:border-primary/50 p-4 rounded-xl transition-all hover:shadow-md">
                                                <div className="flex items-start gap-3">
                                                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                                                        {i + 1}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                                                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-12 text-center bg-secondary/20 hover:bg-secondary/30 transition-colors">
                            <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6 shadow-sm">
                                <Sparkles className="w-10 h-10 text-primary/40" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Ready to Analyze</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Upload your resume and define the target role to receive a comprehensive AI-powered scoring report.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResumeScorer;
