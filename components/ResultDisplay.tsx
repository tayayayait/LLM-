import React, { useState, useEffect, useMemo } from 'react';
import { StreamStatus } from '../types';
import { CopyIcon, ShareIcon, SparklesIcon, CheckIcon } from './icons';

interface ResultDisplayProps {
  summary: string | null;
  streamingText: string;
  streamStatus: StreamStatus;
  streamProgress: number | null;
  streamError: string | null;
  onRetry?: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  summary,
  streamingText,
  streamStatus,
  streamProgress,
  streamError,
  onRetry,
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const normalizedProgress = useMemo(() => {
    if (typeof streamProgress !== 'number' || Number.isNaN(streamProgress)) {
      return null;
    }
    if (streamProgress <= 0) {
      return 0;
    }
    if (streamProgress >= 1) {
      return 1;
    }
    return streamProgress;
  }, [streamProgress]);

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

  useEffect(() => {
    setCopyStatus('idle');
    setShareStatus('idle');
  }, [summary, streamingText, streamStatus]);

  const handleCopy = () => {
    const textToCopy = summary ?? streamingText;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
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

  const renderStreamingContent = () => {
    const percent = normalizedProgress !== null ? Math.round(normalizedProgress * 100) : null;

    return (
      <>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/60">
          <div className="flex items-center gap-2 text-indigo-200">
            <SparklesIcon className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">실시간 요약 생성 중</span>
          </div>
          {percent !== null && <span className="text-xs text-slate-400">{percent}%</span>}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 whitespace-pre-wrap text-slate-200">
          {streamingText ? (
            streamingText
          ) : (
            <span className="text-slate-500">첫 번째 응답을 기다리는 중입니다...</span>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/60">
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-200"
              style={{ width: `${percent !== null ? percent : 8}%` }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {percent !== null ? '모델 응답이 전송되고 있습니다.' : 'LangChain 파이프라인을 준비하는 중입니다.'}
          </p>
        </div>
      </>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
      <SparklesIcon className="w-16 h-16" />
      <p className="mt-4 text-lg font-semibold">요약 결과가 여기에 표시됩니다</p>
      <p className="text-sm">파일을 업로드하고 원하는 요약 길이를 선택해주세요.</p>
    </div>
  );

  const renderErrorContent = () => (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-6 whitespace-pre-wrap text-slate-300">
        {streamingText ? (
          <>
            <p className="text-xs text-slate-500 mb-3">중간까지 생성된 요약</p>
            {streamingText}
          </>
        ) : (
          <div className="text-center text-slate-500">생성된 요약이 없습니다.</div>
        )}
      </div>
      <div className="border-t border-slate-700 bg-slate-900/60 px-6 py-6 text-center">
        <p className="text-sm text-red-300 font-medium">스트리밍이 중단되었습니다.</p>
        {streamError && <p className="text-xs text-red-200 mt-2">{streamError}</p>}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            다시 시도하기
          </button>
        )}
      </div>
    </>
  );

  const renderCompleteContent = () => {
    const content = summary ?? streamingText;

    if (!content) {
      return renderEmptyState();
    }

    return (
      <>
        <div className="prose prose-invert max-w-none prose-p:text-slate-300 whitespace-pre-wrap flex-grow overflow-y-auto p-6">
          {content}
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
              disabled={!summary}
              className="flex items-center justify-center px-4 py-2 w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600/70 disabled:text-slate-400 rounded-md text-sm font-medium transition-colors"
            >
              {shareStatus === 'copied' ? <CheckIcon className="w-5 h-5 mr-2 text-green-400" /> : <ShareIcon className="w-5 h-5 mr-2" />}
              {shareStatus === 'copied' ? '링크 복사 완료!' : '링크 공유'}
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderContent = () => {
    if (streamStatus === 'streaming') {
      return renderStreamingContent();
    }

    if (streamStatus === 'error') {
      return renderErrorContent();
    }

    if (streamStatus === 'complete' || summary) {
      return renderCompleteContent();
    }

    return renderEmptyState();
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg flex flex-col h-full overflow-hidden border border-slate-700">
        {renderContent()}
    </div>
  );
};

export default ResultDisplay;
