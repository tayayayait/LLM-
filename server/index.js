import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { randomUUID } from 'crypto';

const app = express();
const upload = multer();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cleanWhitespace = (text) => text.replace(/\s+/g, ' ').trim();

const sanitizeText = (input) => {
  if (!input) {
    return '';
  }
  return cleanWhitespace(
    input
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
      .replace(/[\r\t]+/g, ' ')
  );
};

const extractTextFromRequest = (req) => {
  if (req.body && typeof req.body.text === 'string' && req.body.text.trim()) {
    return req.body.text;
  }

  const file = req.file;
  if (!file || !file.buffer) {
    return '';
  }

  const isTextFile =
    (typeof file.mimetype === 'string' && file.mimetype.startsWith('text/')) ||
    /\.(txt|md|csv|log|json)$/i.test(file.originalname ?? '');

  try {
    const encoding = isTextFile ? 'utf-8' : undefined;
    const raw = encoding ? file.buffer.toString(encoding) : file.buffer.toString('utf-8');
    return sanitizeText(raw);
  } catch (error) {
    console.warn('Failed to decode uploaded file as UTF-8.', error);
    return sanitizeText(file.buffer.toString('utf-8'));
  }
};

const sentenceSplit = (text) => {
  const trimmed = sanitizeText(text);
  if (!trimmed) {
    return [];
  }
  return trimmed
    .split(/(?<=[.!?\u3002\uFF01\uFF1F])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
};

const buildSummarySections = (sentences, length) => {
  const limit = length === 'medium' ? 6 : 3;
  if (sentences.length === 0) {
    return [];
  }
  if (sentences.length <= limit) {
    return sentences;
  }
  return sentences.slice(0, limit);
};

const formatByTemplate = (sections, template) => {
  if (!sections.length) {
    return '요약할 문장을 찾지 못했습니다.';
  }

  switch (template) {
    case 'RND_REPORT': {
      const intro = '🔬 연구 개발 핵심 요약';
      const bulletPoints = sections.map((section, index) => `${index + 1}. ${section}`);
      const closing = '📌 추가 분석이 필요하면 해당 항목을 선택해 주세요.';
      return [intro, ...bulletPoints, '', closing].join('\n');
    }
    case 'HR_BULLET': {
      const intro = '👥 HR 브리핑';
      const bullets = sections.map((section) => `• ${section}`);
      const reminder = '✅ 인사 담당자는 민감 정보를 재확인해 주세요.';
      return [intro, ...bullets, '', reminder].join('\n');
    }
    case 'SALES_ACTION_ITEMS': {
      const intro = '💼 영업 실행 항목';
      const actionItems = sections.map((section, index) => `- [ ] (${index + 1}) ${section}`);
      const followUp = '⚡ 다음 미팅 전까지 항목을 점검하세요.';
      return [intro, ...actionItems, '', followUp].join('\n');
    }
    default: {
      return sections.join(' ');
    }
  }
};

const buildSummary = (text, length, template) => {
  const sentences = sentenceSplit(text);
  const sections = buildSummarySections(sentences, length);
  return formatByTemplate(sections, template);
};

const tokenizeSummary = (summary) => {
  if (!summary) {
    return [];
  }
  const tokens = summary.match(/\S+\s*/g);
  if (!tokens) {
    return [summary];
  }
  return tokens;
};

app.post('/api/summarize/stream', upload.single('file'), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const traceId = randomUUID();
  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  let clientClosed = false;
  req.on('close', () => {
    clientClosed = true;
  });

  try {
    send({ type: 'start', trace_id: traceId });
    send({ type: 'progress', value: 0.05, label: '업로드된 문서 전처리 중' });

    const textContent = extractTextFromRequest(req);
    if (!textContent) {
      send({ type: 'error', message: '요약할 텍스트를 확인할 수 없습니다.' });
      return;
    }

    send({ type: 'progress', value: 0.15, label: 'LangChain 파이프라인 준비 중' });

    const length = typeof req.body?.summary_length === 'string' ? req.body.summary_length : 'short';
    const template = typeof req.body?.summary_template === 'string' ? req.body.summary_template : 'default';

    const summary = buildSummary(textContent, length, template);
    const tokens = tokenizeSummary(summary);

    if (!tokens.length) {
      send({ type: 'error', message: '생성된 요약이 비어 있습니다.' });
      return;
    }

    send({ type: 'progress', value: 0.25, label: '토큰 스트리밍 시작' });

    const totalTokens = tokens.length;

    for (let index = 0; index < tokens.length; index += 1) {
      if (clientClosed) {
        console.info('Client closed the connection, stopping stream early.');
        return;
      }

      const token = tokens[index];
      const progress = (index + 1) / totalTokens;
      send({ type: 'token', token, index: index + 1, total: totalTokens, progress });

      if (index === Math.floor(totalTokens / 2)) {
        send({ type: 'progress', value: Math.min(0.25 + progress * 0.6, 0.9), label: '요약 문장 정리 중' });
      }

      await wait(80);
    }

    if (clientClosed) {
      return;
    }

    send({ type: 'progress', value: 1, label: '요약 완료' });
    send({ type: 'complete', summary, trace_id: traceId });
  } catch (error) {
    console.error('Streaming summarize endpoint failed:', error);
    const message =
      error instanceof Error ? error.message : '요약 처리 중 알 수 없는 오류가 발생했습니다.';
    send({ type: 'error', message });
  } finally {
    send({ type: 'end' });
    res.end();
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Streaming summarize service listening on port ${PORT}`);
  });
}

export default app;
