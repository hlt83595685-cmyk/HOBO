import React, { useEffect, useState, useRef, useCallback } from 'react';

interface PdfImagePreviewProps {
  url: string;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const PdfImagePreview: React.FC<PdfImagePreviewProps> = ({ url }) => {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  // Default scale set to 1.0 (100%)
  const [scale, setScale] = useState<number>(1.0);
  
  // Drag scrolling state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    const loadPdf = async () => {
      if (!url || !window.pdfjsLib) return;
      setLoading(true);
      try {
        const loadingTask = window.pdfjsLib.getDocument(url);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err) {
        console.error('Error loading PDF:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPdf();
  }, [url]);

  // Handle Ctrl + Wheel for Zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        // Zoom step size
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => {
           const nextScale = prev + delta;
           return Math.min(Math.max(nextScale, 0.5), 5.0); // Clamp between 0.5 and 5.0
        });
      }
    };

    // Add passive: false to allow preventDefault()
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 5.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1.0));

  // Drag Event Handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setStartPos({ x: e.pageX, y: e.pageY });
    setScrollPos({ 
      left: containerRef.current.scrollLeft, 
      top: containerRef.current.scrollTop 
    });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - startPos.x;
    const y = e.pageY - startPos.y;
    containerRef.current.scrollLeft = scrollPos.left - x;
    containerRef.current.scrollTop = scrollPos.top - y;
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-academic-200 text-academic-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
        <p>正在渲染原文...</p>
      </div>
    );
  }

  if (!pdfDoc) {
    return (
      <div className="h-full flex items-center justify-center bg-academic-200 text-academic-500">
        <p>无法加载 PDF 预览</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-academic-200">
      {/* Toolbar */}
      <div className="h-12 bg-white border-b border-academic-300 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
         <h2 className="text-sm font-semibold text-academic-700">原文预览 ({numPages} 页)</h2>
         <div className="flex items-center gap-2">
            <button 
              onClick={handleZoomOut}
              className="p-1.5 rounded hover:bg-academic-100 text-academic-600 disabled:opacity-50"
              disabled={scale <= 0.5}
              title="缩小"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-xs font-mono w-12 text-center text-academic-600">{Math.round(scale * 100)}%</span>
            <button 
              onClick={handleZoomIn}
              className="p-1.5 rounded hover:bg-academic-100 text-academic-600 disabled:opacity-50"
              disabled={scale >= 5.0}
              title="放大"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
         </div>
      </div>

      {/* Pages Container with Drag Support */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto p-4 md:p-8 space-y-4 shadow-inner ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {Array.from(new Array(numPages), (el, index) => (
          <PdfPage key={`page_${index + 1}`} pdfDoc={pdfDoc} pageNumber={index + 1} scale={scale} />
        ))}
      </div>
    </div>
  );
};

const PdfPage: React.FC<{ pdfDoc: any; pageNumber: number; scale: number }> = ({ pdfDoc, pageNumber, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        // Cancel previous render if existing
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNumber);
        
        // Quality factor: ensure sufficient pixel density
        const viewport = page.getViewport({ scale: scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Adjust style width/height for layout
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        
        await renderTask.promise;
        setRendered(true);
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
            console.error(`Error rendering page ${pageNumber}:`, err);
        }
      }
    };

    // Debounce rapid scale changes
    const timer = setTimeout(() => {
        renderPage();
    }, 200);

    return () => {
        clearTimeout(timer);
        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
        }
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div 
      ref={containerRef}
      className="bg-white shadow-lg rounded-sm overflow-hidden relative flex justify-center shrink-0"
      style={{ minHeight: `${scale * 200}px` }} 
    >
      <canvas 
        ref={canvasRef} 
        className="block bg-white" 
        style={{ display: rendered ? 'block' : 'none' }}
      />
      {!rendered && (
         <div className="absolute inset-0 flex items-center justify-center bg-white z-0">
            <div className="animate-pulse w-full h-full bg-gray-100 rounded flex items-center justify-center">
                <span className="text-gray-400 text-sm">Loading Page {pageNumber}...</span>
            </div>
         </div>
      )}
    </div>
  );
};

export default PdfImagePreview;