import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IngestionResponse,
  IngestionLogPage,
  SmsIngestionRequest,
  ImapConfig,
  EmailConnectionStatus,
  EmailScanResult,
  SupportedBank,
  StatementUploadResponse,
} from '../models/ingestion.model';

@Injectable({ providedIn: 'root' })
export class IngestionService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ingest`;

  // ── SMS ──────────────────────────────────────────────────────────────────

  /**
   * Submit a list of raw SMS strings for parsing.
   * Maps to POST /api/v1/ingest/sms/bulk
   */
  submitSms(smsTexts: string[]): Observable<IngestionResponse> {
    const body: SmsIngestionRequest = { smsTexts };
    return this.http
      .post<any>(`${this.baseUrl}/sms/bulk`, body)
      .pipe(
        map((res) => {
          const data = res?.data ?? res;
          // Normalize backend field names → frontend model names
          if (data?.transactions) {
            data.transactions = data.transactions.map((t: any) => ({
              ...t,
              parsingConfidence: t.parsingConfidence ?? t.confidence ?? 0,
              referenceNumber:   t.referenceNumber  ?? t.refNumber  ?? null,
            }));
          }
          return data as IngestionResponse;
        })
      );
  }

  /**
   * Fetch the paginated ingestion audit log.
   * Maps to GET /api/v1/ingest/log
   */
  getIngestionLog(page = 0, size = 10): Observable<IngestionLogPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http
      .get<any>(`${this.baseUrl}/log`, { params })
      .pipe(map((res) => res?.data ?? res));
  }

  // ── Email ────────────────────────────────────────────────────────────────

  /** Initiate Gmail OAuth connection. Maps to POST /api/v1/ingest/email/connect */
  connectGmail(authCode: string): Observable<EmailConnectionStatus> {
    return this.http
      .post<any>(`${this.baseUrl}/email/connect`, { provider: 'GMAIL', authCode })
      .pipe(map((res) => res?.data ?? res));
  }

  /** Connect via IMAP credentials. Maps to POST /api/v1/ingest/email/connect */
  connectImap(config: ImapConfig): Observable<EmailConnectionStatus> {
    return this.http
      .post<any>(`${this.baseUrl}/email/connect`, { provider: 'IMAP', ...config })
      .pipe(map((res) => res?.data ?? res));
  }

  /** Trigger an email scan for transaction alerts. Maps to POST /api/v1/ingest/email/sync */
  syncEmail(): Observable<EmailScanResult> {
    return this.http
      .post<any>(`${this.baseUrl}/email/sync`, {})
      .pipe(map((res) => res?.data ?? res));
  }

  /** Get current email connection status. Maps to GET /api/v1/ingest/email/status */
  getEmailStatus(): Observable<EmailConnectionStatus> {
    return this.http
      .get<any>(`${this.baseUrl}/email/status`)
      .pipe(map((res) => res?.data ?? res));
  }

  /** Disconnect email provider. Maps to DELETE /api/v1/ingest/email/connect */
  disconnectEmail(): Observable<void> {
    return this.http
      .delete<any>(`${this.baseUrl}/email/connect`)
      .pipe(map((res) => res?.data ?? res));
  }

  // ── Bank Statement ────────────────────────────────────────────────────────

  /**
   * Upload a bank statement file (PDF/CSV/XLSX) for parsing.
   * Uses a raw HttpRequest so callers can subscribe to upload-progress events.
   * Maps to POST /api/v1/ingest/statement/upload
   */
  uploadStatement(
    file: File,
    bankName: SupportedBank,
    password?: string,
  ): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('bankName', bankName);
    if (password) {
      formData.append('password', password);
    }

    const req = new HttpRequest(
      'POST',
      `${this.baseUrl}/statement/upload`,
      formData,
      { reportProgress: true },
    );

    return this.http.request(req);
  }

  /**
   * Poll parsing progress for large statement files.
   * Maps to GET /api/v1/ingest/statement/{id}/status
   */
  getStatementStatus(id: string): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/statement/${id}/status`)
      .pipe(map((res) => res?.data ?? res));
  }
}
