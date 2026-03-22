import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';

export const routes: Routes = [
  // ── Auth (public) ───────────────────────────────────────────────────────────
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // ── Dashboard ───────────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component'),
  },

  // ── Data Ingestion (Week 2) ─────────────────────────────────────────────────
  {
    path: 'ingest',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/data-ingestion/data-ingestion.component').then(
        (m) => m.DataIngestionComponent
      ),
    children: [
      {
        path: 'sms',
        loadComponent: () =>
          import('./features/data-ingestion/sms-import/sms-import.component').then(
            (m) => m.SmsImportComponent
          ),
      },
      {
        path: 'log',
        loadComponent: () =>
          import('./features/data-ingestion/ingestion-log/ingestion-log.component').then(
            (m) => m.IngestionLogComponent
          ),
      },
      { path: '', redirectTo: 'sms', pathMatch: 'full' },
    ],
  },

  // ── Fallback ────────────────────────────────────────────────────────────────
  { path: '',   redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' },
];
