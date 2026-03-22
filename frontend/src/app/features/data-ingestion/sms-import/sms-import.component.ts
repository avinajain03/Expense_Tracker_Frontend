import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { IngestionService } from '../../../core/services/ingestion.service';
import { ParsedTransactionPreview } from '../../../core/models/ingestion.model';

@Component({
  selector: 'app-sms-import',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TextareaModule,
    TableModule,
    ToastModule,
    CheckboxModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './sms-import.component.html',
  styleUrls: ['./sms-import.component.scss'],
})
export class SmsImportComponent {
  private ingestionService = inject(IngestionService);
  private messageService = inject(MessageService);

  // ── State ──────────────────────────────────────────────────────────────────
  rawSmsInput = '';
  loading = signal(false);
  importing = signal(false);
  parsedTransactions = signal<ParsedTransactionPreview[]>([]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  duplicateCount = signal(0);
  failedCount = signal(0);

  // ── Confidence helpers ────────────────────────────────────────────────────
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

  // ── Actions ───────────────────────────────────────────────────────────────
  get hasInput(): boolean {
    return this.rawSmsInput.trim().length > 0;
  }

  get selectedTransactions(): ParsedTransactionPreview[] {
    return this.parsedTransactions().filter((t) => t.selected);
  }

  toggleAll(checked: boolean): void {
    this.parsedTransactions.update((list) =>
      list.map((t) => ({ ...t, selected: checked }))
    );
  }

  parse(): void {
    const lines = this.rawSmsInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (!lines.length) return;

    this.loading.set(true);
    this.parsedTransactions.set([]);

    this.ingestionService.submitSms(lines).subscribe({
      next: (res) => {
        this.parsedTransactions.set(
          res.transactions.map((t) => ({ ...t, selected: true }))
        );
        this.duplicateCount.set(res.duplicateCount);
        this.failedCount.set(res.failedCount);
        this.loading.set(false);

        this.messageService.add({
          severity: 'success',
          summary: 'Parsed',
          detail: `${res.parsedCount} transactions extracted`,
          life: 3000,
        });
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Parse Failed',
          detail: 'Could not connect to the backend. Is the server running?',
          life: 5000,
        });
      },
    });
  }

  importSelected(): void {
    const selected = this.selectedTransactions;
    if (!selected.length) return;
    this.messageService.add({
      severity: 'info',
      summary: 'Importing',
      detail: `${selected.length} transaction(s) queued for import`,
      life: 3000,
    });
  }

  importAll(): void {
    const all = this.parsedTransactions();
    if (!all.length) return;
    this.parsedTransactions.update((list) =>
      list.map((t) => ({ ...t, selected: true }))
    );
    this.importSelected();
  }

  clearAll(): void {
    this.rawSmsInput = '';
    this.parsedTransactions.set([]);
    this.duplicateCount.set(0);
    this.failedCount.set(0);
  }
}
