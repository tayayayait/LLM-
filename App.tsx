import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SummaryLength, SummaryTemplate, StreamStatus } from './types';
import FileUploader from './components/FileUploader';
import SummaryOptions from './components/SummaryOptions';
import ResultDisplay from './components/ResultDisplay';
import SharedResultPage from './components/SharedResultPage';
import { summarizeStream } from './services/streamingService';
import { SparklesIcon } from './components/icons';

const App: React.FC = () => {
  const [hash, setHash] = useState(window.location.hash);
  const [file, setFile] = useState<File | null>(null);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>(SummaryLength.Short);
  const [summaryTemplate, setSummaryTemplate] = useState<SummaryTemplate>(SummaryTemplate.Default);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const [streamingText, setStreamingText] = useState('');
  const [streamProgress, setStreamProgress] = useState<number | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const streamControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef(0);

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
    setStreamError(null);
    setIsLoading(true);
    setSummary(null);
    setStreamStatus('streaming');
    setStreamingText('');
    setStreamProgress(null);

    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }

    activeRequestIdRef.current += 1;
    const requestId = activeRequestIdRef.current;

    const controller = new AbortController();
    streamControllerRef.current = controller;

    const runIfActive = (updater: () => void) => {
      if (activeRequestIdRef.current === requestId) {
        updater();
      }
    };

    try {
      const result = await summarizeStream(
        {
          file,
          length: summaryLength,
          template: summaryTemplate,
          signal: controller.signal,
        },
        {
          onStart: ({ traceId }) => {
            runIfActive(() => {
              if (traceId) {
                console.info('LangChain trace ID:', traceId);
              }
            });
          },
          onToken: (payload) => {
            runIfActive(() => {
              setStreamingText((prev) => prev + payload.token);

              if (typeof payload.progress === 'number') {
                setStreamProgress(payload.progress);
              } else if (typeof payload.index === 'number' && typeof payload.total === 'number' && payload.total > 0) {
                setStreamProgress(payload.index / payload.total);
              }
            });
          },
          onProgress: ({ value }) => {
            if (typeof value === 'number') {
              runIfActive(() => {
                setStreamProgress(value);
              });
            }
          },
          onError: (message) => {
            runIfActive(() => {
              setStreamError(message);
              setStreamStatus('error');
            });
          },
          onComplete: ({ summary: streamedSummary }) => {
            runIfActive(() => {
              if (streamedSummary) {
                setStreamingText(streamedSummary);
              }
              setStreamProgress(1);
            });
          },
        }
      );

      if (result.summary) {
        runIfActive(() => {
          setSummary(result.summary);
          setStreamStatus('complete');
        });
      } else {
        runIfActive(() => {
          setStreamError('요약이 생성되지 않았습니다. 다시 시도해주세요.');
          setStreamStatus('error');
        });
      }
    } catch (err) {
      if (activeRequestIdRef.current === requestId) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setStreamError('요약 요청이 취소되었습니다.');
        } else if (err instanceof Error) {
          setStreamError(err.message);
        } else {
          setStreamError('요약 스트리밍 중 알 수 없는 오류가 발생했습니다.');
        }
        setStreamStatus('error');
        setSummary(null);
      }
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false);
        if (streamControllerRef.current === controller) {
          streamControllerRef.current = null;
        }
      }
    }
  }, [file, summaryLength, summaryTemplate]);

  useEffect(() => {
    return () => {
      activeRequestIdRef.current += 1;
      if (streamControllerRef.current) {
        streamControllerRef.current.abort();
      }
    };
  }, []);

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
              <h2 className="text-xl font-semibold text-slate-200">2. 요약 옵션 선택</h2>
              <SummaryOptions
                selectedLength={summaryLength}
                onLengthChange={setSummaryLength}
                selectedTemplate={summaryTemplate}
                onTemplateChange={setSummaryTemplate}
              />
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
          <ResultDisplay
            summary={summary}
            streamingText={streamingText}
            streamStatus={streamStatus}
            streamProgress={streamProgress}
            streamError={streamError}
            onRetry={file ? handleGenerateSummary : undefined}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
