import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IngestionResponse,
  IngestionLogPage,
  SmsIngestionRequest,
} from '../models/ingestion.model';

@Injectable({ providedIn: 'root' })
export class IngestionService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ingest`;

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
}
