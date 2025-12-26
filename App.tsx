import React, { useState, useCallback } from 'react';
import FileUploader from './components/FileUploader';
import AnalysisPanel from './components/AnalysisPanel';
import IllustrationPanel from './components/IllustrationPanel';
import PdfImagePreview from './components/PdfImagePreview';
import { streamPdfAnalysis, generateMethodologyIllustration } from './services/geminiService';
import { FileData, AnalysisState, AnalysisStatus, IllustrationState } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<FileData | null>(null);
  
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: AnalysisStatus.IDLE,
    text: '',
  });

  const [illustrationState, setIllustrationState] = useState<IllustrationState>({
    status: AnalysisStatus.IDLE,
  });

  const handleFileSelected = useCallback(async (selectedFile: FileData) => {
    setFile(selectedFile);
    
    // Reset states
    setAnalysisState({ status: AnalysisStatus.ANALYZING, text: '' });
    setIllustrationState({ status: AnalysisStatus.ANALYZING });

    // 1. Start Analysis Stream
    const analysisPromise = streamPdfAnalysis(selectedFile.base64, (chunk) => {
      setAnalysisState((prev) => ({
        ...prev,
        text: prev.text + chunk,
      }));
    })
    .then(() => {
      setAnalysisState((prev) => ({ ...prev, status: AnalysisStatus.COMPLETED }));
    })
    .catch((err) => {
      console.error(err);
      setAnalysisState((prev) => ({ 
        ...prev, 
        status: AnalysisStatus.ERROR, 
        error: err instanceof Error ? err.message : 'Analysis failed' 
      }));
    });

    // 2. Start Illustration Generation (Parallel)
    const illustrationPromise = generateMethodologyIllustration(selectedFile.base64)
    .then((result) => {
        setIllustrationState({
            status: AnalysisStatus.COMPLETED,
            imageUrl: result.imageUrl,
            prompt: result.promptUsed
        });
    })
    .catch((err) => {
        console.error("Illustration error", err);
        setIllustrationState((prev) => ({
            ...prev,
            status: AnalysisStatus.ERROR,
            error: "Failed to generate illustration"
        }));
    });

    // We don't await here to allow UI to update immediately while promises run
    await Promise.allSettled([analysisPromise, illustrationPromise]);

  }, []);

  return (
    <div className="flex flex-col h-screen bg-academic-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-academic-200 z-20 shrink-0">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
               SL
             </div>
             <div>
                <h1 className="text-xl font-bold text-academic-900 tracking-tight">ScholarLens AI</h1>
                <p className="text-xs text-academic-500">Academic PDF Analysis Assistant</p>
             </div>
          </div>
          
          <div className="text-sm text-academic-500">
             {file ? (
               <span className="flex items-center gap-2 bg-academic-50 px-3 py-1 rounded-full border border-academic-200">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
                 {file.name}
               </span>
             ) : (
                <span>未选择文件</span>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {!file ? (
          // Initial Upload Screen
          <div className="h-full flex flex-col items-center justify-center p-6 animate-fade-in">
             <div className="max-w-xl w-full">
                <div className="text-center mb-10">
                   <h2 className="text-3xl font-bold text-academic-800 mb-4">深入理解每一篇论文</h2>
                   <p className="text-academic-500 text-lg">
                     上传 PDF，即可获取严谨的学术总结、方法论可视化图解及关键数据分析。
                   </p>
                </div>
                <FileUploader onFileSelected={handleFileSelected} isLoading={false} />
             </div>
          </div>
        ) : (
          // Split View
          <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-academic-300">
            {/* Left: PDF Image Preview */}
            <div className="h-1/2 md:h-full md:w-1/2 overflow-hidden bg-academic-100 relative">
              <PdfImagePreview url={file.url} />
            </div>

            {/* Right: Analysis & Tools */}
            <div className="h-1/2 md:h-full md:w-1/2 bg-white flex flex-col relative">
              <div className="flex-1 overflow-y-auto">
                 <AnalysisPanel state={analysisState} />
                 
                 <div className="p-6 pt-0">
                    <IllustrationPanel state={illustrationState} />
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;