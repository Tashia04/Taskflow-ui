import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-left">
          <a routerLink="/dashboard" class="brand">
            <span class="logo-icon">⚡</span>
            <span class="brand-text">TaskFlow <small>Pro</small></span>
          </a>

          <div class="nav-links">
            <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
              <span class="icon">📋</span> Kanban Board
            </a>
            <a routerLink="/projects" routerLinkActive="active" class="nav-item">
              <span class="icon">📁</span> Projets
            </a>
          </div>
        </div>

        <div class="nav-right">
          @if (user()) {
            <div class="user-badge-container">
              <div class="avatar">{{ user()?.name?.charAt(0)?.toUpperCase() }}</div>
              <div class="user-details">
                <span class="user-name">{{ user()?.name }}</span>
                <span class="role-badge" [ngClass]="roleClass()">
                  {{ roleLabel() }}
                </span>
              </div>
            </div>

            <button class="btn-logout" (click)="onLogout()" title="Déconnexion">
              <span>🚪</span> Déconnexion
            </button>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: sticky;
      top: 0;
      z-index: 100;
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
    }

    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 2.5rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .brand-text {
      color: #fff;
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }

    .brand-text small {
      color: #a855f7;
      font-size: 0.7rem;
      text-transform: uppercase;
      background: rgba(168, 85, 247, 0.15);
      padding: 0.15rem 0.4rem;
      border-radius: 6px;
      font-weight: 600;
      margin-left: 0.2rem;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-item {
      color: #94a3b8;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
      padding: 0.5rem 0.85rem;
      border-radius: 10px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .nav-item:hover {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-item.active {
      color: #fff;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .user-badge-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(30, 41, 59, 0.5);
      padding: 0.35rem 0.85rem 0.35rem 0.4rem;
      border-radius: 30px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: #fff;
      font-weight: 700;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      color: #f8fafc;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .role-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      width: fit-content;
      margin-top: 0.1rem;
    }

    .role-admin {
      background: rgba(168, 85, 247, 0.2);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.3);
    }

    .role-manager {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .role-developer {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .btn-logout {
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 0.5rem 0.9rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
    }
  `]
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;

  roleLabel = computed(() => {
    const role = this.user()?.role;
    if (role === 'admin') return 'Administrateur';
    if (role === 'manager') return 'Manager';
    return 'Développeur';
  });

  roleClass = computed(() => {
    const role = this.user()?.role;
    return `role-${role || 'developer'}`;
  });

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }
}
