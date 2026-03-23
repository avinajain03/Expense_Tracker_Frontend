import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';

import { IngestionService } from '../../../core/services/ingestion.service';
import {
  ImapConfig,
  EmailConnectionStatus,
  DetectedEmail,
  EmailScanResult,
} from '../../../core/models/ingestion.model';

@Component({
  selector: 'app-email-connect',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    InputNumberModule,
    CheckboxModule,
    TableModule,
    ToastModule,
    TooltipModule,
    ToggleSwitchModule,
  ],
  providers: [MessageService],
  templateUrl: './email-connect.component.html',
  styleUrls: ['./email-connect.component.scss'],
})
export class EmailConnectComponent implements OnInit {
  private ingestionService = inject(IngestionService);
  private messageService = inject(MessageService);

  // ── Connection State ────────────────────────────────────────────────────
  connectionStatus = signal<EmailConnectionStatus | null>(null);
  loading = signal(false);
  syncing = signal(false);
  disconnecting = signal(false);

  // ── IMAP Form ───────────────────────────────────────────────────────────
  showImapForm = signal(false);
  imapConfig: ImapConfig = {
    host: '',
    port: 993,
    email: '',
    password: '',
    ssl: true,
  };

  // ── Scan Results ────────────────────────────────────────────────────────
  scanResult = signal<EmailScanResult | null>(null);

  // ── Lifecycle ───────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.fetchStatus();
  }

  // ── Computed ─────────────────────────────────────────────────────────────
  get isConnected(): boolean {
    return this.connectionStatus()?.connected === true;
  }

  get selectedEmails(): DetectedEmail[] {
    return this.scanResult()?.emails.filter((e) => e.selected) ?? [];
  }

  get imapFormValid(): boolean {
    return (
      this.imapConfig.host.trim().length > 0 &&
      this.imapConfig.port > 0 &&
      this.imapConfig.email.trim().length > 0 &&
      this.imapConfig.password.trim().length > 0
    );
  }

  // ── Confidence helpers ──────────────────────────────────────────────────
  confidenceClass(score: number): string {
    if (score >= 0.9) return 'conf-high';
    if (score >= 0.7) return 'conf-medium';
    return 'conf-low';
  }

  confidenceLabel(score: number): string {
    if (score >= 0.9) return 'High';
    if (score >= 0.7) return 'Medium';
    return 'Low';
  }

  confidencePercent(score: number): string {
    return `${Math.round(score * 100)}%`;
  }

  // ── Actions ─────────────────────────────────────────────────────────────

  fetchStatus(): void {
    this.loading.set(true);
    this.ingestionService.getEmailStatus().subscribe({
      next: (status) => {
        this.connectionStatus.set(status);
        this.loading.set(false);
      },
      error: () => {
        // Backend not available; default to disconnected state
        this.connectionStatus.set({
          connected: false,
          provider: null,
          email: null,
          lastSyncAt: null,
          syncedCount: 0,
          syncStatus: 'DISCONNECTED',
          errorMessage: null,
        });
        this.loading.set(false);
      },
    });
  }

  connectGmail(): void {
    // In production, this would open a popup/redirect for Google OAuth
    // For now, simulate the auth code exchange
    this.loading.set(true);
    this.messageService.add({
      severity: 'info',
      summary: 'Gmail OAuth',
      detail: 'Initiating Google sign-in flow…',
      life: 3000,
    });

    // Simulated — replace with real OAuth popup flow
    this.ingestionService.connectGmail('simulated-auth-code').subscribe({
      next: (status) => {
        this.connectionStatus.set(status);
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Connected',
          detail: `Gmail account connected successfully`,
          life: 3000,
        });
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Connection Failed',
          detail: 'Could not connect to Gmail. Is the backend running?',
          life: 5000,
        });
      },
    });
  }

  connectImap(): void {
    if (!this.imapFormValid) return;
    this.loading.set(true);

    this.ingestionService.connectImap(this.imapConfig).subscribe({
      next: (status) => {
        this.connectionStatus.set(status);
        this.showImapForm.set(false);
        this.loading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Connected',
          detail: `IMAP account ${this.imapConfig.email} connected`,
          life: 3000,
        });
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Connection Failed',
          detail: 'Could not connect via IMAP. Check credentials and try again.',
          life: 5000,
        });
      },
    });
  }

  syncNow(): void {
    this.syncing.set(true);
    this.scanResult.set(null);

    this.ingestionService.syncEmail().subscribe({
      next: (result) => {
        this.scanResult.set({
          ...result,
          emails: result.emails.map((e) => ({ ...e, selected: true })),
        });
        this.syncing.set(false);
        this.fetchStatus(); // refresh counts

        this.messageService.add({
          severity: 'success',
          summary: 'Scan Complete',
          detail: `Found ${result.transactionEmailsFound} transaction emails`,
          life: 3000,
        });
      },
      error: () => {
        this.syncing.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Sync Failed',
          detail: 'Could not scan emails. Try again later.',
          life: 5000,
        });
      },
    });
  }

  disconnect(): void {
    this.disconnecting.set(true);
    this.ingestionService.disconnectEmail().subscribe({
      next: () => {
        this.connectionStatus.set({
          connected: false,
          provider: null,
          email: null,
          lastSyncAt: null,
          syncedCount: 0,
          syncStatus: 'DISCONNECTED',
          errorMessage: null,
        });
        this.scanResult.set(null);
        this.disconnecting.set(false);
        this.messageService.add({
          severity: 'info',
          summary: 'Disconnected',
          detail: 'Email account has been disconnected',
          life: 3000,
        });
      },
      error: () => {
        this.disconnecting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Could not disconnect. Try again.',
          life: 5000,
        });
      },
    });
  }

  toggleAllEmails(checked: boolean): void {
    this.scanResult.update((r) =>
      r ? { ...r, emails: r.emails.map((e) => ({ ...e, selected: checked })) } : r
    );
  }

  importSelected(): void {
    const count = this.selectedEmails.length;
    if (!count) return;
    this.messageService.add({
      severity: 'info',
      summary: 'Importing',
      detail: `${count} transaction email(s) queued for import`,
      life: 3000,
    });
  }

  toggleImapForm(): void {
    this.showImapForm.update((v) => !v);
  }
}
