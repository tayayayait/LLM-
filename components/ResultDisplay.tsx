import React, { useState, useEffect } from 'react';
import { CopyIcon, ShareIcon, SparklesIcon, CheckIcon } from './icons';

interface ResultDisplayProps {
  summary: string | null;
  isLoading: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ summary, isLoading }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    if (copyStatus === 'copied') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);
  
  useEffect(() => {
    if (shareStatus === 'copied') {
      const timer = setTimeout(() => setShareStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [shareStatus]);

  const handleCopy = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopyStatus('copied');
    }
  };
  
  const handleShare = () => {
      if (summary) {
          const encodedSummary = btoa(encodeURIComponent(summary));
          const url = `${window.location.origin}${window.location.pathname}#/s/${encodedSummary}`;
          navigator.clipboard.writeText(url);
          setShareStatus('copied');
      }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6">
          <SparklesIcon className="w-12 h-12 animate-spin text-indigo-400" />
          <p className="mt-4 text-lg font-semibold">요약 생성 중...</p>
          <p className="text-sm">잠시만 기다려 주세요.</p>
          <div className="w-full mt-8 space-y-3">
            <div className="h-4 bg-slate-700 rounded-full animate-pulse w-full"></div>
            <div className="h-4 bg-slate-700 rounded-full animate-pulse w-5/6"></div>
            <div className="h-4 bg-slate-700 rounded-full animate-pulse w-full"></div>
            <div className="h-4 bg-slate-700 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      );
    }

    if (summary) {
      return (
        <>
          <div className="prose prose-invert max-w-none prose-p:text-slate-300 whitespace-pre-wrap flex-grow overflow-y-auto p-6">
            {summary}
          </div>
          <div className="border-t border-slate-700 p-4 mt-auto bg-slate-800/50">
             <p className="text-xs text-slate-500 mb-4 text-center">
                AI가 생성한 초안입니다. 중요한 정보는 반드시 확인해주세요.
              </p>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center px-4 py-2 w-full bg-slate-700 hover:bg-slate-600 rounded-md text-sm font-medium transition-colors"
              >
                {copyStatus === 'copied' ? <CheckIcon className="w-5 h-5 mr-2 text-green-400" /> : <CopyIcon className="w-5 h-5 mr-2" />}
                {copyStatus === 'copied' ? '복사 완료!' : '텍스트 복사'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center px-4 py-2 w-full bg-slate-700 hover:bg-slate-600 rounded-md text-sm font-medium transition-colors"
              >
                {shareStatus === 'copied' ? <CheckIcon className="w-5 h-5 mr-2 text-green-400" /> : <ShareIcon className="w-5 h-5 mr-2" />}
                {shareStatus === 'copied' ? '링크 복사 완료!' : '링크 공유'}
              </button>
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
        <SparklesIcon className="w-16 h-16" />
        <p className="mt-4 text-lg font-semibold">요약 결과가 여기에 표시됩니다</p>
        <p className="text-sm">파일을 업로드하고 원하는 요약 길이를 선택해주세요.</p>
      </div>
    );
  };
  
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg flex flex-col h-full overflow-hidden border border-slate-700">
        {renderContent()}
    </div>
  );
};

export default ResultDisplay;
