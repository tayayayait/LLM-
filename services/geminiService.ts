import { SummaryLength, SummarizeResponse } from '../types';

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

const summarizeEndpoint = baseUrl ? buildEndpoint(baseUrl, '/api/summarize') : null;

export const generateSummary = async (
  file: File,
  length: SummaryLength
): Promise<SummarizeResponse> => {
  if (!summarizeEndpoint) {
    return {
      error: '백엔드 요약 서비스 URL이 설정되지 않았습니다.',
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('summary_length', length);

  try {
    const response = await fetch(summarizeEndpoint, {
      method: 'POST',
      body: formData,
    });

    let json: unknown;
    try {
      json = await response.json();
    } catch (parseError) {
      console.error('Failed to parse summarize response:', parseError);
      return {
        error: '요약 응답을 해석하는 중 오류가 발생했습니다.',
      };
    }

    const data = json as {
      summary?: unknown;
      trace_id?: unknown;
      error?: unknown;
    };

    const parsed: SummarizeResponse = {
      summary: typeof data.summary === 'string' ? data.summary : undefined,
      trace_id: typeof data.trace_id === 'string' ? data.trace_id : undefined,
      error: typeof data.error === 'string' ? data.error : undefined,
    };

    if (!response.ok) {
      return {
        ...parsed,
        error: parsed.error ?? '요약 생성 요청이 실패했습니다.',
      };
    }

    if (!parsed.summary) {
      return {
        ...parsed,
        error: parsed.error ?? '요약이 응답에 포함되지 않았습니다.',
      };
    }

    return parsed;
  } catch (error) {
    console.error('Error requesting summary:', error);
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return {
      error: `요약을 요청하는 중 오류가 발생했습니다. ${message}`,
    };
  }
};
