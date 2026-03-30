import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenRefreshRequest,
} from '../models/user.model';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly apiUrl = `${environment.apiBaseUrl}/auth`;

  // ─── Signals ────────────────────────────────────────────────────────────────
  private _currentUser = signal<User | null>(this.loadUserFromStorage());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());

  // ─── Token Helpers ───────────────────────────────────────────────────────────
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this._currentUser.set(response.user);
  }

  private loadUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  // ─── Response Mapper ─────────────────────────────────────────────────────────
  private mapToAuthResponse(raw: any): AuthResponse {
    const d = raw?.data ?? raw;
    return {
      accessToken: d.accessToken,
      refreshToken: d.refreshToken,
      user: {
        id: d.userId ?? d.id,
        email: d.mail ?? d.email,
        fullName: d.fullName,
        age: d.age ?? 0,
        monthlyIncome: d.monthlyIncome ?? 0,
        currency: d.currency ?? 'INR',
        avatarUrl: d.avatarUrl,
      },
    };
  }

  // ─── Auth Methods ────────────────────────────────────────────────────────────
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<any>(`${this.apiUrl}/register`, data)
      .pipe(map((res) => this.mapToAuthResponse(res)), tap((res) => this.saveSession(res)));
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, data)
      .pipe(map((res) => this.mapToAuthResponse(res)), tap((res) => this.saveSession(res)));
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    const body: TokenRefreshRequest = { refreshToken: refreshToken ?? '' };
    return this.http
      .post<any>(`${this.apiUrl}/refresh`, body)
      .pipe(map((res) => this.mapToAuthResponse(res)), tap((res) => this.saveSession(res)));
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
