import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly authService = inject(AuthService);

  collapsed = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',   icon: 'pi-home',           route: '/dashboard' },
    { label: 'Import Data', icon: 'pi-upload',          route: '/import' },
    { label: 'Transactions',icon: 'pi-list',            route: '/transactions' },
    { label: 'Goals',       icon: 'pi-flag',            route: '/goals' },
    { label: 'Investments', icon: 'pi-chart-line',      route: '/investments' },
    { label: 'Budgets',     icon: 'pi-wallet',          route: '/budgets' },
    { label: 'Analytics',   icon: 'pi-chart-bar',       route: '/analytics' },
    { label: 'AI Insights', icon: 'pi-sparkles',        route: '/ai-insights' },
    { label: 'Settings',    icon: 'pi-cog',             route: '/settings' },
  ];

  toggle(): void {
    this.collapsed.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}
