export enum SummaryLength {
  Short = 'short',
  Medium = 'medium',
}

export interface FileData {
  content: string;
  mimeType: string;
  isBase64: boolean;
}
