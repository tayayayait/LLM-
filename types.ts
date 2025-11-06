export enum SummaryLength {
  Short = 'short',
  Medium = 'medium',
}

export enum SummaryTemplate {
  Default = 'default',
  RndReport = 'RND_REPORT',
  HrBullet = 'HR_BULLET',
  SalesActionItems = 'SALES_ACTION_ITEMS',
}

export interface SummarizeResponse {
  summary?: string;
  trace_id?: string;
  error?: string;
}
