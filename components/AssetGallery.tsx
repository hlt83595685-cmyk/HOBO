import React, { useEffect, useRef, useState } from 'react';
import { AssetsState, AnalysisStatus } from '../types';

interface AssetGalleryProps {
  fileUrl: string;
  state: AssetsState;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const AssetGallery: React.FC<AssetGalleryProps> = ({ fileUrl, state }) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  useEffect(() => {
    const loadPdf = async () => {
      if (!fileUrl || !window.pdfjsLib) return;
      try {
        const loadingTask = window.pdfjsLib.getDocument(fileUrl);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
      } catch (err) {
        console.error('Error loading PDF:', err);
      }
    };
    loadPdf();
  }, [fileUrl]);

  if (state.status === AnalysisStatus.ANALYZING || state.status === AnalysisStatus.UPLOADING) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-academic-50 text-academic-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <p>正在提取关键图表...</p>
      </div>
    );
  }

  if (state.status === AnalysisStatus.COMPLETED && state.data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-academic-50 text-academic-400">
        <p>未在文档中检测到关键图表。</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-academic-100 overflow-y-auto p-4 space-y-6">
      <h2 className="text-lg font-bold text-academic-800 sticky top-0 bg-academic-100 py-2 z-10 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        关键图表与表格
      </h2>
      {state.data.map((asset, index) => (
        <AssetItem key={`${asset.pageNumber}-${index}`} pdfDoc={pdfDoc} asset={asset} />
      ))}
    </div>
  );
};

const AssetItem: React.FC<{ pdfDoc: any; asset: any }> = ({ pdfDoc, asset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || isRendered) return;
      
      try {
        const page = await pdfDoc.getPage(asset.pageNumber);
        const viewport = page.getViewport({ scale: 1.5 }); // Good quality scale
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
        setIsRendered(true);
      } catch (err) {
        console.error('Error rendering page:', asset.pageNumber, err);
      }
    };
    renderPage();
  }, [pdfDoc, asset.pageNumber, isRendered]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-academic-200 overflow-hidden">
      <div className="px-4 py-3 bg-academic-50 border-b border-academic-200 flex justify-between items-center">
        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${asset.type === 'Figure' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
          {asset.type}
        </span>
        <span className="text-xs text-academic-500">Page {asset.pageNumber}</span>
      </div>
      <div className="relative bg-white min-h-[200px] flex items-center justify-center bg-gray-100 overflow-hidden">
         {/* We crop visually by just showing the canvas. 
             Since we can't perfectly crop the specific figure, showing the page is the context.
             To improve UX, we allow scrolling/viewing the full page. */}
         <canvas ref={canvasRef} className="max-w-full h-auto" />
      </div>
      <div className="p-3 text-sm text-academic-700 border-t border-academic-100 bg-white">
        {asset.description}
      </div>
    </div>
  );
};

export default AssetGallery;