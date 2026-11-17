import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="glass-card">
        <div class="brand">
          <div class="logo-icon">⚡</div>
          <h1>TaskFlow <span class="badge">Pro</span></h1>
          <p class="subtitle">Connectez-vous pour accéder à vos projets et tâches</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger">
            <span>⚠️ {{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Adresse Email</label>
            <div class="input-wrapper">
              <span class="input-icon">✉️</span>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="ex: manager@taskflow.com"
                [class.invalid]="isFieldInvalid('email')"
              />
            </div>
            @if (isFieldInvalid('email')) {
              <small class="error-msg">Veuillez entrer une adresse email valide.</small>
            }
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                id="password"
                type="password"
                formControlName="password"
                placeholder="••••••••"
                [class.invalid]="isFieldInvalid('password')"
              />
            </div>
            @if (isFieldInvalid('password')) {
              <small class="error-msg">Le mot de passe doit contenir au moins 6 caractères.</small>
            }
          </div>

          <button type="submit" class="btn-primary" [disabled]="loginForm.invalid || isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span> Connexion en cours...
            } @else {
              <span>Se connecter ➔</span>
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Vous n'avez pas de compte ? <a routerLink="/auth/register">Créer un compte</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at top left, #1e1b4b, #0f172a, #020617);
      padding: 1.5rem;
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
    }

    .glass-card {
      width: 100%;
      max-width: 440px;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .brand {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    h1 {
      color: #f8fafc;
      font-size: 1.85rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .badge {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: #fff;
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .subtitle {
      color: #94a3b8;
      font-size: 0.9rem;
      margin-top: 0.5rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    label {
      display: block;
      color: #cbd5e1;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      font-size: 1rem;
    }

    input {
      width: 100%;
      padding: 0.85rem 1rem 0.85rem 2.75rem;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #fff;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      outline: none;
    }

    input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
      background: rgba(30, 41, 59, 0.9);
    }

    input.invalid {
      border-color: #ef4444;
    }

    .error-msg {
      color: #f87171;
      font-size: 0.8rem;
      margin-top: 0.35rem;
      display: block;
    }

    .alert {
      padding: 0.85rem 1rem;
      border-radius: 12px;
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }

    .alert-danger {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .btn-primary {
      width: 100%;
      padding: 0.9rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .auth-footer a {
      color: #a855f7;
      text-decoration: none;
      font-weight: 600;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  returnUrl: string = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Identifiants incorrects. Veuillez réessayer.'
        );
      }
    });
  }
}
