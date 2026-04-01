import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType, HttpErrorResponse } from '@angular/common/http';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';

import { IngestionService } from '../../../core/services/ingestion.service';
import {
  SupportedBank,
  StatementParsedTransaction,
  StatementUploadResponse,
} from '../../../core/models/ingestion.model';

interface BankOption {
  label: string;
  value: SupportedBank;
}

@Component({
  selector: 'app-statement-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ToastModule,
    TooltipModule,
    SelectModule,
    ProgressBarModule,
    CheckboxModule,
  ],
  providers: [MessageService],
  templateUrl: './statement-upload.component.html',
  styleUrls: ['./statement-upload.component.scss'],
})
export class StatementUploadComponent {
  private ingestionService = inject(IngestionService);
  private messageService = inject(MessageService);

  // ── Bank selector ─────────────────────────────────────────────────────────
  readonly bankOptions: BankOption[] = [
    { label: 'HDFC Bank', value: 'HDFC' },
    { label: 'SBI', value: 'SBI' },
    { label: 'ICICI Bank', value: 'ICICI' },
    { label: 'Axis Bank', value: 'AXIS' },
    { label: 'Kotak Mahindra', value: 'KOTAK' },
    { label: 'Other', value: 'OTHER' },
  ];
  selectedBank = signal<BankOption | null>(null);

  // ── File state ────────────────────────────────────────────────────────────
  readonly acceptedTypes = '.pdf,.csv,.xlsx';
  readonly maxFileSizeMB = 10;
  selectedFile = signal<File | null>(null);
  dragging = signal(false);

  // ── Upload progress ───────────────────────────────────────────────────────
  uploading = signal(false);
  uploadPercent = signal(0);

  // ── Password dialog state ─────────────────────────────────────────────────
  showPasswordDialog = signal(false);
  pdfPassword = signal('');
  passwordError = signal<string | null>(null);
  submittingPassword = signal(false);
  showPassword = signal(false);

  // ── Results ───────────────────────────────────────────────────────────────
  uploadResult = signal<StatementUploadResponse | null>(null);
  parsedTransactions = signal<StatementParsedTransaction[]>([]);

  // ── Confidence helpers (shared pattern with SMS) ──────────────────────────
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

  // ── Computed helpers ──────────────────────────────────────────────────────
  get canUpload(): boolean {
    return !!this.selectedFile() && !!this.selectedBank() && !this.uploading();
  }

  get selectedTransactions(): StatementParsedTransaction[] {
    return this.parsedTransactions().filter((t) => t.selected);
  }

  get fileInfo(): string {
    const f = this.selectedFile();
    if (!f) return '';
    const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
    return `${f.name} (${sizeMB} MB)`;
  }

  get fileTypeIcon(): string {
    const f = this.selectedFile();
    if (!f) return 'pi pi-file';
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pi pi-file-pdf';
    if (ext === 'csv') return 'pi pi-file';
    if (ext === 'xlsx' || ext === 'xls') return 'pi pi-file-excel';
    return 'pi pi-file';
  }

  // ── Drag-and-drop handlers ────────────────────────────────────────────────
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
      input.value = ''; // reset so same file can be re-selected
    }
  }

  private handleFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const validExts = ['pdf', 'csv', 'xlsx', 'xls'];

    if (!validExts.includes(ext)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File',
        detail: `Only PDF, CSV, and Excel files are accepted. Got .${ext}`,
        life: 4000,
      });
      return;
    }

    if (file.size > this.maxFileSizeMB * 1024 * 1024) {
      this.messageService.add({
        severity: 'error',
        summary: 'File Too Large',
        detail: `Maximum file size is ${this.maxFileSizeMB} MB.`,
        life: 4000,
      });
      return;
    }

    this.selectedFile.set(file);
    // Clear previous results
    this.uploadResult.set(null);
    this.parsedTransactions.set([]);
    this.uploadPercent.set(0);
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.uploadResult.set(null);
    this.parsedTransactions.set([]);
    this.uploadPercent.set(0);
  }

  // ── Upload action ─────────────────────────────────────────────────────────
  upload(password?: string): void {
    const file = this.selectedFile();
    const bank = this.selectedBank();
    if (!file || !bank) return;

    this.uploading.set(true);
    this.uploadPercent.set(0);

    this.ingestionService.uploadStatement(file, bank.value, password).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const pct = event.total
            ? Math.round((100 * event.loaded) / event.total)
            : 0;
          this.uploadPercent.set(pct);
        } else if (event.type === HttpEventType.Response) {
          const body = event.body as any;
          const data: StatementUploadResponse = body?.data ?? body;
          this.uploadResult.set(data);
          this.parsedTransactions.set(
            (data.transactions ?? []).map((t) => ({ ...t, selected: true }))
          );
          this.uploading.set(false);
          this.uploadPercent.set(100);
          // Close password dialog on success
          this.dismissPasswordDialog();

          this.messageService.add({
            severity: 'success',
            summary: 'Statement Parsed',
            detail: `${data.parsedCount} transaction(s) extracted from ${data.fileName}`,
            life: 4000,
          });
        }
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.uploadPercent.set(0);

        const errorBody = err.error;
        const errorCode = errorBody?.errorCode ?? errorBody?.error ?? '';
        const errorMsg = errorBody?.message ?? errorBody?.detail ?? '';

        // Backend signals that the PDF is password-protected
        if (
          err.status === 422 &&
          (errorCode === 'PASSWORD_REQUIRED' ||
           errorMsg.toLowerCase().includes('password') ||
           errorMsg.toLowerCase().includes('encrypted'))
        ) {
          this.showPasswordDialog.set(true);
          this.pdfPassword.set('');
          this.passwordError.set(null);
          this.submittingPassword.set(false);
          this.showPassword.set(false);
          return;
        }

        // Backend signals wrong password
        if (
          (err.status === 400 || err.status === 422) &&
          (errorCode === 'INVALID_PASSWORD' ||
           errorMsg.toLowerCase().includes('incorrect password') ||
           errorMsg.toLowerCase().includes('wrong password') ||
           errorMsg.toLowerCase().includes('invalid password'))
        ) {
          this.passwordError.set('Incorrect password. Please try again.');
          this.submittingPassword.set(false);
          return;
        }

        this.dismissPasswordDialog();
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: errorMsg || 'Could not upload the statement. Is the backend running?',
          life: 5000,
        });
      },
    });
  }

  // ── Password dialog actions ───────────────────────────────────────────────
  submitWithPassword(): void {
    const pw = this.pdfPassword().trim();
    if (!pw) {
      this.passwordError.set('Please enter the PDF password.');
      return;
    }
    this.passwordError.set(null);
    this.submittingPassword.set(true);
    this.upload(pw);
  }

  dismissPasswordDialog(): void {
    this.showPasswordDialog.set(false);
    this.pdfPassword.set('');
    this.passwordError.set(null);
    this.submittingPassword.set(false);
    this.showPassword.set(false);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  // ── Table actions ─────────────────────────────────────────────────────────
  toggleAll(checked: boolean): void {
    this.parsedTransactions.update((list) =>
      list.map((t) => ({ ...t, selected: checked }))
    );
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
    this.selectedFile.set(null);
    this.selectedBank.set(null);
    this.uploadResult.set(null);
    this.parsedTransactions.set([]);
    this.uploadPercent.set(0);
  }
}
