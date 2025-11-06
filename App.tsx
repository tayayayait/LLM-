import React, { useState, useEffect, useCallback } from 'react';
import { SummaryLength, FileData } from './types';
import FileUploader from './components/FileUploader';
import SummaryOptions from './components/SummaryOptions';
import ResultDisplay from './components/ResultDisplay';
import SharedResultPage from './components/SharedResultPage';
import { generateSummary } from './services/geminiService';
import { SparklesIcon } from './components/icons';

const readFile = (file: File): Promise<FileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    
    if (file.name.toLowerCase().endsWith('.txt')) {
      reader.onload = () => resolve({
        content: reader.result as string,
        mimeType: 'text/plain',
        isBase64: false
      });
      reader.readAsText(file);
    } else if (file.name.toLowerCase().endsWith('.docx')) {
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({
          content: base64String,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          isBase64: true
        });
      };
      reader.readAsDataURL(file);
    } else {
      reject(new Error('Unsupported file type'));
    }
  });
};

const App: React.FC = () => {
  const [hash, setHash] = useState(window.location.hash);
  const [file, setFile] = useState<File | null>(null);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>(SummaryLength.Short);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleGenerateSummary = useCallback(async () => {
    if (!file) {
      setError('먼저 파일을 업로드해주세요.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setSummary(null);

    try {
      const fileData = await readFile(file);
      const result = await generateSummary(fileData, summaryLength);
      setSummary(result);
    } catch (err) {
      console.error(err);
      setError('파일을 읽거나 요약을 생성하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [file, summaryLength]);

  const isSummarizeDisabled = !file || isLoading;
  
  if (hash.startsWith('#/s/')) {
      const encodedSummary = hash.substring(4);
      return <SharedResultPage encodedSummary={encodedSummary} />;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl mb-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <SparklesIcon className="w-8 h-8 text-indigo-400" />
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">Nexus AI 어시스턴트</h1>
        </div>
        <p className="mt-2 text-slate-400">안전한 내부 문서 요약을 위한 AI 도구</p>
      </header>
      
      <main className="w-full max-w-6xl flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8 p-6 sm:p-8 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-200">1. 문서 업로드</h2>
              <FileUploader onFileChange={setFile} setError={setError} file={file} />
          </div>

          <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-200">2. 요약 길이 선택</h2>
              <SummaryOptions selectedLength={summaryLength} onLengthChange={setSummaryLength} />
          </div>
          
          {error && (
            <div className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm" role="alert">
                {error}
            </div>
          )}

          <div className="mt-auto pt-4">
            <button
              onClick={handleGenerateSummary}
              disabled={isSummarizeDisabled}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                         disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400
                         hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
            >
                <SparklesIcon className="w-5 h-5"/>
                요약 생성하기
            </button>
          </div>
        </div>

        <div className="h-[70vh] lg:h-auto">
          <ResultDisplay summary={summary} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default App;
