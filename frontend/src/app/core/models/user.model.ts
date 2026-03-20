export interface User {
  id: string;
  email: string;
  fullName: string;
  age: number;
  monthlyIncome: number;
  currency: string;
  avatarUrl?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  age: number;
  monthlyIncome: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}
