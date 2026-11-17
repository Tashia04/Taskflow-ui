import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';
import { AuthResponse, ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // State Signals pour Angular moderne
  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(this.getStoredToken());

  constructor(private http: HttpClient) {}

  /**
   * Inscription utilisateur
   */
  register(userData: { name: string; email: string; password: string; password_confirmation: string; role?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  /**
   * Connexion utilisateur
   */
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response))
    );
  }

  /**
   * Obtenir l'utilisateur actuel connecté
   */
  me(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/me`).pipe(
      tap(res => {
        this.currentUser.set(res.user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
      })
    );
  }

  /**
   * Déconnexion
   */
  logout(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearStorage())
    );
  }

  /**
   * Stocker les données de session après succès
   */
  private handleAuthSuccess(response: AuthResponse): void {
    if (response.token) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
      this.token.set(response.token);
    }
    if (response.user) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      this.currentUser.set(response.user);
    }
  }

  /**
   * Effacer la session localement
   */
  clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  /**
   * Vérifications d'état
   */
  isLoggedIn(): boolean {
    return !!this.token() && !!this.currentUser();
  }

  getToken(): string | null {
    return this.token() || localStorage.getItem(this.TOKEN_KEY);
  }

  getUserRole(): UserRole | null {
    return this.currentUser()?.role || null;
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isManager(): boolean {
    return this.getUserRole() === 'manager';
  }

  isDeveloper(): boolean {
    return this.getUserRole() === 'developer';
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}
