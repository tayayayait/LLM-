import React, { useState, useEffect } from 'react';
import { SparklesIcon } from './icons';

interface SharedResultPageProps {
  encodedSummary: string;
}

const SharedResultPage: React.FC<SharedResultPageProps> = ({ encodedSummary }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const decodedSummary = decodeURIComponent(atob(encodedSummary));
      setSummary(decodedSummary);
    } catch (e) {
      setError('요약 내용을 불러올 수 없습니다. 링크가 잘못되었거나 만료되었을 수 있습니다.');
      console.error('Decoding error:', e);
    }
  }, [encodedSummary]);
  
  const handleTryNexus = () => {
    window.location.hash = '#/';
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-4xl mb-6">
        <div className="bg-slate-800 border border-indigo-500/30 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <SparklesIcon className="w-8 h-8 text-indigo-400 flex-shrink-0" />
            <p className="text-slate-300">
            이 요약은 Nexus AI 어시스턴트로 생성되었습니다.
            </p>
            <button onClick={handleTryNexus} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 whitespace-nowrap">
                ✨ 직접 사용해보기!
            </button>
        </div>
      </header>

      <main className="w-full max-w-4xl bg-slate-800 rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-4">공유된 요약</h1>
        {error ? (
          <div className="text-red-400 bg-red-900/50 p-4 rounded-md">
            <p className="font-semibold">오류</p>
            <p>{error}</p>
          </div>
        ) : summary ? (
          <div className="prose prose-invert max-w-none prose-p:text-slate-300 whitespace-pre-wrap">
            {summary}
          </div>
        ) : (
          <div className="text-slate-400">요약 내용 로딩 중...</div>
        )}
         <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-slate-700">
            AI가 생성한 초안입니다. 중요한 정보는 반드시 확인해주세요.
          </p>
      </main>
    </div>
  );
};

export default SharedResultPage;
