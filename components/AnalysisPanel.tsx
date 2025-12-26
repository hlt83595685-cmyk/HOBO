import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { AnalysisState, AnalysisStatus } from '../types';

interface AnalysisPanelProps {
  state: AnalysisState;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ state }) => {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-academic-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-academic-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          智能分析报告
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {state.status === AnalysisStatus.IDLE && (
          <div className="h-full flex flex-col items-center justify-center text-academic-400">
            <p>等待分析...</p>
          </div>
        )}

        {state.status === AnalysisStatus.UPLOADING && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-academic-500">正在准备文件...</p>
          </div>
        )}

        {(state.status === AnalysisStatus.ANALYZING || state.status === AnalysisStatus.COMPLETED) && (
          <div className="prose prose-slate max-w-none academic-text">
             <ReactMarkdown 
                remarkPlugins={[remarkMath]} 
                rehypePlugins={[rehypeKatex, rehypeRaw]} // Added rehypeRaw
                components={{
                  // Level 1: Core Content Extraction, etc.
                  h1: ({node, ...props}) => (
                    <h1 className="text-2xl md:text-3xl font-bold italic text-academic-900 mt-8 mb-6 pb-2 border-b border-academic-100" {...props} />
                  ),
                  // Level 2: Subsections (optional if used)
                  h2: ({node, ...props}) => (
                    <h2 className="text-xl md:text-2xl font-bold italic text-academic-800 mt-6 mb-4" {...props} />
                  ),
                  // Level 3: Specifically for "Author Summary", "Innovation", etc. - Black, Bold, Larger
                  h3: ({node, ...props}) => (
                    <h3 className="text-xl font-black text-black mt-6 mb-3" {...props} />
                  ),
                  // Highlight key terms (bold text)
                  strong: ({node, ...props}) => (
                    <strong className="font-bold text-primary bg-blue-50 px-1 rounded mx-0.5" {...props} />
                  ),
                  // Custom rendering for tables
                  table: ({node, ...props}) => (
                    <div className="overflow-x-auto my-6 border border-academic-200 rounded-lg shadow-sm">
                      <table className="min-w-full divide-y divide-academic-200" {...props} />
                    </div>
                  ),
                  th: ({node, ...props}) => (
                    <th className="px-4 py-3 bg-academic-50 text-left text-xs font-medium text-academic-500 uppercase tracking-wider" {...props} />
                  ),
                  td: ({node, ...props}) => (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-academic-700 border-t border-academic-100" {...props} />
                  ),
                  blockquote: ({node, ...props}) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-academic-600 bg-academic-50 py-2 pr-2 rounded-r my-4" {...props} />
                  ),
                  p: ({node, ...props}) => (
                    <p className="mb-4 leading-relaxed text-academic-700" {...props} />
                  ),
                  li: ({node, ...props}) => (
                    <li className="mb-2" {...props} />
                  )
                }}
              >
                {state.text}
              </ReactMarkdown>
              
              {state.status === AnalysisStatus.ANALYZING && (
                <div className="mt-4 flex items-center gap-2 text-academic-400 text-sm animate-pulse">
                   <span className="w-2 h-2 bg-primary rounded-full"></span>
                   AI 正在思考撰写中...
                </div>
              )}
          </div>
        )}

        {state.status === AnalysisStatus.ERROR && (
           <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
             <h3 className="font-bold mb-1">发生错误</h3>
             <p>{state.error || "分析过程中出现未知错误。"}</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;