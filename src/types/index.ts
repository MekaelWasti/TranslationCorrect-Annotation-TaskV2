export type TranslationLanguage = 'mandarin' | 'cantonese';

export interface TranslationEntry {
  id: string;
  englishText: string;
  chineseText: string;
  referenceText: string;
  isSubmitted?: boolean;
  language: TranslationLanguage;
}

export interface AnnotatedTranslation extends TranslationEntry {
  editedTranslation: string;
  errorSpans: ErrorSpan[];
  overallScore: number;
}

export interface UserSubmission {
  userId: string;
  translationId: string;
  submittedAt: Date;
  status: 'completed' | 'in_progress';
}

export interface AnnotationSubmission {
  id: string;
  userId: string;
  userEmail: string;
  originalText: string;
  machineTranslation: string;
  editedTranslation: string;
  errorSpans: ErrorSpan[];
  overallScore: number;
  submittedAt: Date;
}

export type ErrorSeverity = 'Minor' | 'Major';

export interface ErrorSpan {
  start: number;
  end: number;
  type: ErrorType;
  text: string;
  severity: ErrorSeverity;
}

export type ErrorType = 
  | 'Addition'
  | 'Omission'
  | 'Mistranslation'
  | 'Untranslated'
  | 'Grammar'
  | 'Spelling'
  | 'Typography'
  | 'Unintelligible';

export interface User {
  uid: string;
  email: string;
}

export interface BatchProps {
  batchNumber: number;
  entries: TranslationEntry[];
} 