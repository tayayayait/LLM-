import { SummaryLength, SummaryTemplate } from '../types';

const buildEndpoint = (base: string, path: string) => {
  if (!path) {
    return base;
  }

  if (base.endsWith('/')) {
    return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
  }

  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const baseUrl = typeof import.meta.env.VITE_BACKEND_URL === 'string'
  ? import.meta.env.VITE_BACKEND_URL.trim()
  : '';

const streamEndpoint = baseUrl ? buildEndpoint(baseUrl, '/api/summarize/stream') : null;

export interface StreamTokenEvent {
  token: string;
  index?: number;
  total?: number;
  progress?: number;
}

export interface StreamProgressEvent {
  value?: number;
  label?: string;
}

export interface StreamCompleteEvent {
  summary: string;
  traceId?: string;
}

export interface SummarizeStreamCallbacks {
  onStart?: (payload: { traceId?: string }) => void;
  onToken?: (payload: StreamTokenEvent) => void;
  onProgress?: (payload: StreamProgressEvent) => void;
  onComplete?: (payload: StreamCompleteEvent) => void;
  onError?: (message: string) => void;
}

export interface SummarizeStreamParams {
  file: File;
  length: SummaryLength;
  template: SummaryTemplate;
  signal?: AbortSignal;
}

export interface SummarizeStreamResult {
  summary?: string;
  traceId?: string;
}

const parseSSEBlock = (block: string): { event?: string; data: string } | null => {
  const lines = block.split(/\r?\n/);
  let dataLines: string[] = [];
  let eventName: string | undefined;

  for (const line of lines) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    } else if (line.startsWith('event:')) {
      eventName = line.slice(6).trim();
    }
  }

  if (!dataLines.length) {
    return null;
  }

  return {
    event: eventName,
    data: dataLines.join('\n'),
  };
};

const ensureEndpoint = () => {
  if (!streamEndpoint) {
    throw new Error('백엔드 스트리밍 서비스 URL이 설정되지 않았습니다.');
  }
  return streamEndpoint;
};

export const summarizeStream = async (
  params: SummarizeStreamParams,
  callbacks: SummarizeStreamCallbacks = {}
): Promise<SummarizeStreamResult> => {
  const endpoint = ensureEndpoint();
  const { file, length, template, signal } = params;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('summary_length', length);
  formData.append('summary_template', template);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'text/event-stream',
    },
    signal,
  });

  if (!response.ok) {
    let message = '요약 스트리밍 요청이 실패했습니다.';
    try {
      const result = await response.json();
      if (result && typeof result.error === 'string') {
        message = result.error;
      }
    } catch {
      // ignore parse errors, fall back to default message
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error('스트리밍 응답 본문이 비어 있습니다. 브라우저 호환성을 확인해주세요.');
  }

  callbacks.onStart?.({ traceId: undefined });

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let finalSummary = '';
  let traceId: string | undefined;
  let completed = false;
  let reportedError: string | undefined;

  const cancelOnAbort = () => {
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          reader.cancel().catch(() => {});
        },
        { once: true }
      );
    }
  };

  cancelOnAbort();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');

      const parsed = parseSSEBlock(rawEvent.trim());
      if (!parsed) {
        continue;
      }

      const { data } = parsed;
      if (!data) {
        continue;
      }

      if (data === '[DONE]') {
        completed = true;
        break;
      }

      let payload: unknown;
      try {
        payload = JSON.parse(data);
      } catch (error) {
        console.warn('Failed to parse SSE payload', error, data);
        continue;
      }

      if (!payload || typeof payload !== 'object') {
        continue;
      }

      const typed = payload as Record<string, unknown>;
      const type = typeof typed.type === 'string' ? typed.type : undefined;

      switch (type) {
        case 'start': {
          const id = typeof typed.trace_id === 'string' ? typed.trace_id : undefined;
          traceId = id ?? traceId;
          callbacks.onStart?.({ traceId });
          break;
        }
        case 'progress': {
          const valueNum = typeof typed.value === 'number' ? typed.value : undefined;
          const label = typeof typed.label === 'string' ? typed.label : undefined;
          callbacks.onProgress?.({ value: valueNum, label });
          break;
        }
        case 'token': {
          const token = typeof typed.token === 'string' ? typed.token : '';
          const index = typeof typed.index === 'number' ? typed.index : undefined;
          const total = typeof typed.total === 'number' ? typed.total : undefined;
          const progress = typeof typed.progress === 'number' ? typed.progress : undefined;
          callbacks.onToken?.({ token, index, total, progress });
          break;
        }
        case 'complete': {
          const summary = typeof typed.summary === 'string' ? typed.summary : '';
          const id = typeof typed.trace_id === 'string' ? typed.trace_id : traceId;
          finalSummary = summary;
          traceId = id;
          completed = true;
          callbacks.onComplete?.({ summary, traceId });
          break;
        }
        case 'error': {
          const message =
            typeof typed.message === 'string' ? typed.message : '요약 스트리밍 중 오류가 발생했습니다.';
          reportedError = message;
          callbacks.onError?.(message);
          break;
        }
        case 'end': {
          // no-op marker for graceful shutdown
          break;
        }
        default: {
          // ignore unknown event types
          break;
        }
      }
    }
  }

  if (reportedError) {
    throw new Error(reportedError);
  }

  if (!completed && !finalSummary) {
    throw new Error('스트리밍이 예기치 않게 종료되었습니다. 다시 시도해주세요.');
  }

  return {
    summary: finalSummary || undefined,
    traceId,
  };
};
