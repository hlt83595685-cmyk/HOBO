import React, { useCallback, useState } from 'react';
import { FileData } from '../types';

interface FileUploaderProps {
  onFileSelected: (file: FileData) => void;
  isLoading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      alert('仅支持 PDF 文件');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('文件大小不能超过 20MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      const url = URL.createObjectURL(file);
      onFileSelected({
        name: file.name,
        type: file.type,
        size: file.size,
        base64,
        url,
      });
    };
    reader.readAsDataURL(file);
  }, [onFileSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile, isLoading]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
        flex flex-col items-center justify-center h-64
        ${isDragging 
          ? 'border-primary bg-blue-50 scale-[1.02]' 
          : 'border-academic-300 hover:border-academic-400 bg-white'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <input
        type="file"
        accept="application/pdf"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        onChange={handleFileInput}
        disabled={isLoading}
      />
      
      <div className="pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-academic-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-lg font-medium text-academic-700">
          点击或拖拽上传 PDF 论文
        </p>
        <p className="text-sm text-academic-500 mt-2">
          最大支持 20MB
        </p>
      </div>
    </div>
  );
};

export default FileUploader;