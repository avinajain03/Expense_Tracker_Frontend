import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IngestionResponse,
  IngestionLogPage,
  SmsIngestionRequest,
  ImapConfig,
  EmailConnectionStatus,
  EmailScanResult,
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
    return this.http.post<IngestionResponse>(`${this.baseUrl}/sms/bulk`, body);
  }

  /**
   * Fetch the paginated ingestion audit log.
   * Maps to GET /api/v1/ingest/log
   */
  getIngestionLog(page = 0, size = 10): Observable<IngestionLogPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<IngestionLogPage>(`${this.baseUrl}/log`, { params });
  }

  // ── Email ────────────────────────────────────────────────────────────────

  /** Initiate Gmail OAuth connection. Maps to POST /api/v1/ingest/email/connect */
  connectGmail(authCode: string): Observable<EmailConnectionStatus> {
    return this.http.post<EmailConnectionStatus>(
      `${this.baseUrl}/email/connect`,
      { provider: 'GMAIL', authCode }
    );
  }

  /** Connect via IMAP credentials. Maps to POST /api/v1/ingest/email/connect */
  connectImap(config: ImapConfig): Observable<EmailConnectionStatus> {
    return this.http.post<EmailConnectionStatus>(
      `${this.baseUrl}/email/connect`,
      { provider: 'IMAP', ...config }
    );
  }

  /** Trigger an email scan for transaction alerts. Maps to POST /api/v1/ingest/email/sync */
  syncEmail(): Observable<EmailScanResult> {
    return this.http.post<EmailScanResult>(`${this.baseUrl}/email/sync`, {});
  }

  /** Get current email connection status. Maps to GET /api/v1/ingest/email/status */
  getEmailStatus(): Observable<EmailConnectionStatus> {
    return this.http.get<EmailConnectionStatus>(`${this.baseUrl}/email/status`);
  }

  /** Disconnect email provider. Maps to DELETE /api/v1/ingest/email/connect */
  disconnectEmail(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/email/connect`);
  }
}
