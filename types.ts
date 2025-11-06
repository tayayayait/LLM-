export enum SummaryLength {
  Short = 'short',
  Medium = 'medium',
}

export interface SummarizeResponse {
  summary?: string;
  trace_id?: string;
  error?: string;
}
