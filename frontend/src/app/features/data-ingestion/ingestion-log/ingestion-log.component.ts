import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';

import { IngestionService } from '../../../core/services/ingestion.service';
import {
  IngestionLogEntry,
  IngestionSource,
  IngestionStatus,
} from '../../../core/models/ingestion.model';

@Component({
  selector: 'app-ingestion-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    SelectModule,
    TagModule,
    TooltipModule,
    PaginatorModule,
  ],
  templateUrl: './ingestion-log.component.html',
  styleUrls: ['./ingestion-log.component.scss'],
})
export class IngestionLogComponent implements OnInit {
  private ingestionService = inject(IngestionService);

  // ── State ──────────────────────────────────────────────────────────────────
  logEntries = signal<IngestionLogEntry[]>([]);
  loading = signal(false);
  totalRecords = signal(0);
  currentPage = signal(0);
  readonly pageSize = 10;

  // ── Filters ────────────────────────────────────────────────────────────────
  selectedSource: IngestionSource | null = null;
  selectedStatus: IngestionStatus | null = null;

  readonly sourceOptions = [
    { label: 'All Sources', value: null },
    { label: 'SMS', value: 'SMS' },
    { label: 'Email', value: 'EMAIL' },
    { label: 'Statement', value: 'BANK_STATEMENT' },
  ];

  readonly statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Success', value: 'SUCCESS' },
    { label: 'Duplicate', value: 'DUPLICATE' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Pending Review', value: 'PENDING_REVIEW' },
  ];

  ngOnInit(): void {
    this.loadLog();
  }

  loadLog(): void {
    this.loading.set(true);
    this.ingestionService.getIngestionLog(this.currentPage(), this.pageSize).subscribe({
      next: (page) => {
        this.logEntries.set(page.content);
        this.totalRecords.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // graceful degradation: show empty table
        this.logEntries.set([]);
      },
    });
  }

  onPageChange(event: any): void {
    if (event.page !== undefined) {
      this.currentPage.set(event.page);
      this.loadLog();
    }
  }

  // ── Display helpers ───────────────────────────────────────────────────────
  statusSeverity(status: IngestionStatus): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'SUCCESS':        return 'success';
      case 'DUPLICATE':      return 'warn';
      case 'FAILED':         return 'danger';
      case 'PENDING_REVIEW': return 'secondary';
    }
  }

  sourceSeverity(source: IngestionSource): 'info' | 'secondary' | 'warn' {
    switch (source) {
      case 'SMS':            return 'info';
      case 'EMAIL':          return 'secondary';
      case 'BANK_STATEMENT': return 'warn';
    }
  }

  truncate(text: string, max = 80): string {
    return text?.length > max ? text.slice(0, max) + '…' : text;
  }

  confidenceClass(score: number): string {
    if (score >= 0.9) return 'conf-high';
    if (score >= 0.7) return 'conf-medium';
    return 'conf-low';
  }

  get filteredEntries(): IngestionLogEntry[] {
    return this.logEntries().filter((e) => {
      const srcMatch = !this.selectedSource || e.source === this.selectedSource;
      const stMatch = !this.selectedStatus || e.status === this.selectedStatus;
      return srcMatch && stMatch;
    });
  }
}
