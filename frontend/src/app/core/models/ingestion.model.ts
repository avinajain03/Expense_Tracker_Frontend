export type IngestionSource = 'SMS' | 'EMAIL' | 'BANK_STATEMENT';
export type IngestionStatus = 'SUCCESS' | 'FAILED' | 'DUPLICATE' | 'PENDING_REVIEW';

export interface ParsedTransactionPreview {
  id?: string;
  merchant: string;
  amount: number;
  date: string;
  currency: string;
  upiPlatform?: string;
  referenceNumber?: string;
  parsingConfidence: number;
  rawText: string;
  selected?: boolean;
}

export interface IngestionResponse {
  parsedCount: number;
  duplicateCount: number;
  failedCount: number;
  transactions: ParsedTransactionPreview[];
}

export interface IngestionLogEntry {
  id: string;
  source: IngestionSource;
  rawText: string;
  status: IngestionStatus;
  parsingConfidence: number;
  createdAt: string;
  transactionId?: string;
  errorMessage?: string;
}

export interface IngestionLogPage {
  content: IngestionLogEntry[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SmsIngestionRequest {
  smsTexts: string[];
}

// ── Email Connect Models ────────────────────────────────────────────────────

export interface ImapConfig {
  host: string;
  port: number;
  email: string;
  password: string;
  ssl: boolean;
}

export type EmailProvider = 'GMAIL' | 'IMAP';
export type EmailSyncStatus = 'CONNECTED' | 'SYNCING' | 'DISCONNECTED' | 'ERROR';

export interface EmailConnectionStatus {
  connected: boolean;
  provider: EmailProvider | null;
  email: string | null;
  lastSyncAt: string | null;
  syncedCount: number;
  syncStatus: EmailSyncStatus;
  errorMessage: string | null;
}

export interface DetectedEmail {
  id: string;
  sender: string;
  subject: string;
  receivedAt: string;
  extractedAmount: number | null;
  extractedMerchant: string | null;
  parsingConfidence: number;
  selected?: boolean;
}

export interface EmailScanResult {
  totalScanned: number;
  transactionEmailsFound: number;
  duplicateCount: number;
  emails: DetectedEmail[];
}
