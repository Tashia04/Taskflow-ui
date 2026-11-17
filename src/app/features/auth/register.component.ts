import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="glass-card">
        <div class="brand">
          <div class="logo-icon">🚀</div>
          <h1>Créer un compte</h1>
          <p class="subtitle">Rejoignez l'espace de travail TaskFlow Pro</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger">
            <span>⚠️ {{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Nom complet</label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input
                id="name"
                type="text"
                formControlName="name"
                placeholder="ex: Jean Dupont"
                [class.invalid]="isFieldInvalid('name')"
              />
            </div>
            @if (isFieldInvalid('name')) {
              <small class="error-msg">Le nom complet est obligatoire.</small>
            }
          </div>

          <div class="form-group">
            <label for="email">Adresse Email</label>
            <div class="input-wrapper">
              <span class="input-icon">✉️</span>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="ex: dev@taskflow.com"
                [class.invalid]="isFieldInvalid('email')"
              />
            </div>
            @if (isFieldInvalid('email')) {
              <small class="error-msg">Adresse email valide obligatoire.</small>
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
                placeholder="Minimum 8 caractères"
                [class.invalid]="isFieldInvalid('password')"
              />
            </div>
            @if (isFieldInvalid('password')) {
              <small class="error-msg">Le mot de passe doit faire au moins 8 caractères.</small>
            }
          </div>

          <div class="form-group">
            <label for="password_confirmation">Confirmer le mot de passe</label>
            <div class="input-wrapper">
              <span class="input-icon">🔑</span>
              <input
                id="password_confirmation"
                type="password"
                formControlName="password_confirmation"
                placeholder="Répéter le mot de passe"
                [class.invalid]="isPasswordMismatch()"
              />
            </div>
            @if (isPasswordMismatch()) {
              <small class="error-msg">Les mots de passe ne correspondent pas.</small>
            }
          </div>

          <button type="submit" class="btn-primary" [disabled]="registerForm.invalid || isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span> Création du compte...
            } @else {
              <span>S'inscrire ➔</span>
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Vous avez déjà un compte ? <a routerLink="/auth/login">Se connecter</a></p>
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
      background: radial-gradient(circle at top right, #1e1b4b, #0f172a, #020617);
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
      margin-bottom: 1.75rem;
    }

    .logo-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    h1 {
      color: #f8fafc;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin: 0;
    }

    .subtitle {
      color: #94a3b8;
      font-size: 0.875rem;
      margin-top: 0.35rem;
    }

    .form-group {
      margin-bottom: 1.15rem;
    }

    label {
      display: block;
      color: #cbd5e1;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.4rem;
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

    input, select {
      width: 100%;
      padding: 0.8rem 1rem 0.8rem 2.75rem;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: #fff;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      outline: none;
      appearance: none;
      -webkit-appearance: none;
    }

    select option {
      background: #0f172a;
      color: #fff;
    }

    input:focus, select:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
      background: rgba(30, 41, 59, 0.9);
    }

    input.invalid, select.invalid {
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
      background: linear-gradient(135deg, #a855f7, #6366f1);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px -5px rgba(168, 85, 247, 0.4);
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
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .auth-footer a {
      color: #6366f1;
      text-decoration: none;
      font-weight: 600;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        password_confirmation: ['', [Validators.required]]
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('password_confirmation')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  isPasswordMismatch(): boolean {
    const confirmControl = this.registerForm.get('password_confirmation');
    return !!(
      this.registerForm.hasError('mismatch') &&
      confirmControl &&
      (confirmControl.dirty || confirmControl.touched)
    );
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || err.error?.errors?.email?.[0] || 'Erreur lors de l\'inscription.';
        this.errorMessage.set(msg);
      }
    });
  }
}
