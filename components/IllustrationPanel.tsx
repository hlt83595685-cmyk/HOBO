import React, { useState } from 'react';
import { IllustrationState, AnalysisStatus } from '../types';

interface IllustrationPanelProps {
  state: IllustrationState;
}

const IllustrationPanel: React.FC<IllustrationPanelProps> = ({ state }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (state.status === AnalysisStatus.IDLE) return null;

  return (
    <div className="mt-6 border border-academic-200 rounded-lg overflow-hidden shadow-sm bg-white">
      <div 
        className="bg-academic-50 px-4 py-3 border-b border-academic-200 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold text-academic-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          AI 生成逻辑架构图
        </h3>
        <button className="text-academic-500 hover:text-academic-700">
           {isExpanded ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
           )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 bg-white transition-all">
          {state.status === AnalysisStatus.ANALYZING && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-sm text-academic-500">正在分析论文逻辑并绘制架构图...</p>
            </div>
          )}

          {state.status === AnalysisStatus.COMPLETED && state.imageUrl && (
            <div className="space-y-3">
               <div className="rounded-lg overflow-hidden border border-academic-200">
                 <img src={state.imageUrl} alt="Generated Logic Diagram" className="w-full h-auto object-cover" />
               </div>
            </div>
          )}

          {state.status === AnalysisStatus.ERROR && (
             <p className="text-red-500 text-sm">生成示意图失败: {state.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default IllustrationPanel;