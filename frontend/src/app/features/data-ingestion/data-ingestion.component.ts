import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data-ingestion',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './data-ingestion.component.html',
  styleUrls: ['./data-ingestion.component.scss'],
})
export class DataIngestionComponent {
  readonly stats = [
    { label: 'Total Imported', value: '—', icon: 'pi pi-database' },
    { label: 'Pending Review', value: '—', icon: 'pi pi-clock' },
    { label: 'Last Sync', value: '—', icon: 'pi pi-refresh' },
  ];

  readonly channels = [
    {
      id: 'sms',
      title: 'SMS Import',
      description: 'Paste bank/UPI SMS messages and let the parser extract your transactions automatically.',
      icon: 'pi pi-mobile',
      route: 'sms',
      gradient: 'linear-gradient(135deg, #00D2FF, #3A7BD5)',
      available: true,
    },
    {
      id: 'email',
      title: 'Email Connect',
      description: 'Connect your Gmail or configure IMAP to auto-scan transaction alert emails.',
      icon: 'pi pi-envelope',
      route: 'email',
      gradient: 'linear-gradient(135deg, #7B2FF7, #C471ED)',
      available: false,
    },
    {
      id: 'statement',
      title: 'Bank Statement',
      description: 'Upload PDF, CSV or Excel bank statements from HDFC, SBI, ICICI and more.',
      icon: 'pi pi-file-pdf',
      route: 'statement',
      gradient: 'linear-gradient(135deg, #00E676, #1DE9B6)',
      available: false,
    },
  ];
}
