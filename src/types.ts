export interface ProcessHistoryItem {
  id: string;
  title: string;
  timestamp: string;
  originalText: string;
  resultText: string;
  language: string;
  style: string;
  customFocus?: string;
  durationMs?: number;
}

export type SummaryStyle = 'complete' | 'concise' | 'decisions';
export type TranslationLanguage = 'none' | 'en' | 'ja' | 'ko' | 'bilingual';

export interface ProcessingOptions {
  title: string;
  style: SummaryStyle;
  language: TranslationLanguage;
  customFocus: string;
}
