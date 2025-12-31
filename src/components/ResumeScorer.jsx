import React, { useState, useCallback } from 'react';
import { model } from '../aiConfig';
import { FileText, Briefcase, Sparkles, CheckCircle, AlertTriangle, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const ResumeScorer = () => {
    const [resumeText, setResumeText] = useState('');
    const [targetRole, setTargetRole] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [fileName, setFileName] = useState('');
    const [fileError, setFileError] = useState('');

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
                            Upload Resume
                        </label>

                        {!fileName ? (
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT (Max 5MB)</p>
                            </div>
                        ) : (
                            <div className="h-64 bg-secondary/50 rounded-xl p-6 flex flex-col items-center justify-center relative border border-border">
                                <button
                                    onClick={clearFile}
                                    className="absolute top-2 right-2 p-1 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <FileText className="w-12 h-12 text-primary mb-3" />
                                <p className="font-medium text-sm truncate max-w-full px-4">{fileName}</p>
                                <p className="text-xs text-muted-foreground mt-1">Ready for analysis</p>
                            </div>
                        )}

                        {fileError && (
                            <div className="mt-2 text-red-500 text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {fileError}
                            </div>
                        )}

                        {/* Fallback Text Area (Hidden but usable if needed or for debugging) */}
                        <div className="mt-4">
                            <details className="text-xs text-muted-foreground">
                                <summary className="cursor-pointer hover:text-primary">Or paste text manually</summary>
                                <textarea
                                    className="w-full h-32 bg-secondary/50 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mt-2"
                                    placeholder="Paste resume text here..."
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
                            <p className="text-center">Enter the target role and upload/paste resume to receive a professional review.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResumeScorer;
