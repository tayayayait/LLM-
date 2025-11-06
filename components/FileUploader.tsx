import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import { UploadIcon, FileIcon, CloseIcon } from './icons';

interface FileUploaderProps {
  onFileChange: (file: File | null) => void;
  setError: (error: string | null) => void;
  file: File | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_EXTENSIONS = ['.txt', '.docx'];

const FileUploader: React.FC<FileUploaderProps> = ({ onFileChange, setError, file }) => {
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback((selectedFile: File): boolean => {
    setError(null);
    if (!SUPPORTED_EXTENSIONS.some(ext => selectedFile.name.toLowerCase().endsWith(ext))) {
      setError(`지원하지 않는 파일 형식입니다. .docx 와 .txt 파일만 지원됩니다.`);
      return false;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('파일 크기가 10MB를 초과합니다.');
      return false;
    }
    return true;
  }, [setError]);

  const handleFile = useCallback((selectedFile: File) => {
    if (validateFile(selectedFile)) {
      onFileChange(selectedFile);
    } else {
      onFileChange(null);
    }
  }, [validateFile, onFileChange]);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
    onFileChange(null);
    setError(null);
  }

  const dropzoneClasses = `relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer ${
    isDragging ? 'border-indigo-400 bg-slate-700 scale-105' : 'border-slate-600 hover:border-slate-500'
  }`;

  return (
    <div className="w-full">
      <label htmlFor="file-upload" className="sr-only">파일 선택</label>
      <div 
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
        className={dropzoneClasses}
      >
        <input id="file-upload" name="file-upload" type="file" className="hidden" onChange={handleChange} accept=".txt,.docx"/>
        {file ? (
          <div className="flex flex-col items-center relative">
            <FileIcon className="w-12 h-12 text-indigo-400" />
            <p className="mt-2 font-medium text-slate-300 break-all">{file.name}</p>
            <p className="text-sm text-slate-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
             <button
              onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
              className="absolute -top-4 -right-4 text-slate-400 hover:text-white rounded-full p-1 bg-slate-700/50 hover:bg-slate-600 transition-colors"
              aria-label="파일 제거"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadIcon className="w-12 h-12 text-slate-500" />
            <p className="mt-4 font-semibold text-slate-300">파일을 드래그 앤 드롭하거나 <span className="text-indigo-400">찾아보기</span></p>
            <p className="mt-1 text-sm text-slate-400">최대 10MB의 .docx, .txt 파일을 지원합니다</p>
          </div>
        )}
      </div>
      {file?.name.endsWith('.docx') && (
        <div className="mt-2 text-xs text-yellow-400 bg-yellow-900/50 p-2 rounded-md">
          참고: .docx 파일 요약은 실험적인 기능입니다. 서식이나 복잡한 요소는 유실될 수 있습니다.
        </div>
      )}
    </div>
  );
};

export default FileUploader;
