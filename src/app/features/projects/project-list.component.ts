import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { ProjectModalComponent } from './project-modal.component';
import { ProjetService } from '../../core/services/projet.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { Project, CreateProjectDto } from '../../core/models/projet.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ProjectModalComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="projects-container">
      <header class="page-header">
        <div class="header-left">
          <h1>Projets & Espaces de Travail</h1>
          <p class="subtitle">Gérez vos équipes et suivez la progression globale des projets</p>
        </div>

        <div class="header-right">
          @if (canCreateProject) {
            <button class="btn-primary" (click)="openCreateModal()">
              <span>➕</span> Nouveau Projet
            </button>
          }
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Chargement des projets...</p>
        </div>
      } @else {
        <div class="projects-grid">
          @for (project of projects(); track project.id) {
            <div class="project-card">
              <div class="card-header">
                <span class="status-badge" [ngClass]="'status-' + project.status">
                  {{ getStatusLabel(project.status) }}
                </span>

                <div class="actions" *ngIf="canManageProject(project)">
                  <button class="btn-icon" (click)="openEditModal(project)" title="Éditer">✏️</button>
                  @if (authService.isAdmin()) {
                    <button class="btn-icon btn-delete" (click)="onDeleteProject(project.id)" title="Supprimer">🗑️</button>
                  }
                </div>
              </div>

              <h2 class="project-title">{{ project.name }}</h2>
              <p class="project-desc">{{ project.description || 'Aucune description fournie.' }}</p>

              <div class="project-meta">
                <div class="meta-item">
                  <span class="label">Tâches associées :</span>
                  <span class="value badge-tasks">{{ project.tasks_count || 0 }} tâches</span>
                </div>

                <div class="meta-item" *ngIf="project.owner">
                  <span class="label">Propriétaire :</span>
                  <span class="value owner-name">👤 {{ project.owner.name }}</span>
                </div>
              </div>

              <!-- Members Avatars -->
              <div class="members-section" *ngIf="project.users && project.users.length > 0">
                <span class="members-label">Membres ({{ project.users.length }}) :</span>
                <div class="avatars-stack">
                  @for (user of project.users; track user.id) {
                    <div class="avatar" [title]="user.name + ' (' + user.role + ')'">
                      {{ user.name.charAt(0).toUpperCase() }}
                    </div>
                  }
                </div>
              </div>

              <div class="card-footer">
                <button class="btn-secondary" (click)="goToTasks(project.id)">
                  <span>📋 Voir les tâches</span> ➔
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-projects">
              <span class="icon">📁</span>
              <h3>Aucun projet trouvé</h3>
              <p>Créez votre premier projet pour commencer à assigner des tâches.</p>
            </div>
          }
        </div>
      }
    </main>

    <!-- Modal Projet -->
    <app-project-modal
      [isOpen]="isModalOpen()"
      [project]="editingProject()"
      [users]="availableUsers()"
      (onClose)="closeModal()"
      (onSave)="onSaveProject($event)"
    ></app-project-modal>
  `,
  styles: [`
    .projects-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
    }

    .header-left h1 {
      color: #f8fafc;
      font-size: 1.85rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.025em;
    }

    .subtitle {
      color: #94a3b8;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #a855f7, #6366f1);
      color: #fff;
      border: none;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 15px -3px rgba(168, 85, 247, 0.4);
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px -5px rgba(168, 85, 247, 0.5);
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .project-card {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.25s ease;
    }

    .project-card:hover {
      transform: translateY(-4px);
      border-color: rgba(168, 85, 247, 0.4);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .status-badge {
      font-size: 0.725rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.2rem 0.65rem;
      border-radius: 20px;
      letter-spacing: 0.03em;
    }

    .status-a_faire {
      background: rgba(148, 163, 184, 0.2);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .status-en_cours {
      background: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .status-termine {
      background: rgba(16, 185, 129, 0.2);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .actions {
      display: flex;
      gap: 0.35rem;
    }

    .btn-icon {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border-radius: 8px;
      padding: 0.25rem 0.45rem;
      font-size: 0.8rem;
      cursor: pointer;
    }

    .btn-delete:hover {
      background: rgba(239, 68, 68, 0.3);
    }

    .project-title {
      color: #f8fafc;
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }

    .project-desc {
      color: #94a3b8;
      font-size: 0.875rem;
      line-height: 1.45;
      margin-bottom: 1.25rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .project-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 1rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.825rem;
    }

    .meta-item .label {
      color: #64748b;
    }

    .meta-item .value {
      color: #cbd5e1;
      font-weight: 500;
    }

    .badge-tasks {
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      font-weight: 600;
    }

    .members-section {
      margin-bottom: 1.25rem;
    }

    .members-label {
      font-size: 0.775rem;
      color: #64748b;
      display: block;
      margin-bottom: 0.35rem;
    }

    .avatars-stack {
      display: flex;
      align-items: center;
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #0f172a;
      margin-left: -6px;
    }

    .avatar:first-child {
      margin-left: 0;
    }

    .card-footer {
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .btn-secondary {
      width: 100%;
      padding: 0.65rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #cbd5e1;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-secondary:hover {
      background: rgba(99, 102, 241, 0.2);
      color: #fff;
      border-color: rgba(99, 102, 241, 0.3);
    }

    .empty-projects {
      grid-column: 1 / -1;
      text-align: center;
      padding: 5rem 1rem;
      background: rgba(15, 23, 42, 0.4);
      border: 2px dashed rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      color: #94a3b8;
    }

    .empty-projects .icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .loading-container {
      text-align: center;
      padding: 5rem 1rem;
      color: #94a3b8;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(168, 85, 247, 0.2);
      border-top-color: #a855f7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ProjectListComponent implements OnInit {
  projects = signal<Project[]>([]);
  availableUsers = signal<User[]>([]);
  isLoading = signal(true);

  // Modal State
  isModalOpen = signal(false);
  editingProject = signal<Project | null>(null);

  constructor(
    private projetService: ProjetService,
    public authService: AuthService,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadDevelopers();
  }

  loadDevelopers(): void {
    // Charger tous les développeurs depuis l'API (pas seulement ceux dans les projets)
    this.userService.getUsers('developer').subscribe({
      next: (developers) => {
        this.availableUsers.set(developers);
      }
    });
  }

  loadProjects(): void {
    this.isLoading.set(true);
    this.projetService.getProjects().subscribe({
      next: (data) => {
        this.projects.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  get canCreateProject(): boolean {
    return this.authService.isAdmin() || this.authService.isManager();
  }

  canManageProject(project: Project): boolean {
    if (this.authService.isAdmin()) return true;
    if (this.authService.isManager()) {
      return project.owner_id === this.authService.currentUser()?.id || project.owner?.id === this.authService.currentUser()?.id;
    }
    return false;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      a_faire: 'À faire',
      en_cours: 'En cours',
      termine: 'Terminé'
    };
    return map[status] || status;
  }

  goToTasks(projectId: number): void {
    this.router.navigate(['/dashboard'], { queryParams: { project_id: projectId } });
  }

  openCreateModal(): void {
    this.editingProject.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(project: Project): void {
    this.editingProject.set(project);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingProject.set(null);
  }

  onSaveProject(formData: any): void {
    const proj = this.editingProject();
    if (proj) {
      this.projetService.updateProject(proj.id, formData).subscribe({
        next: (updated) => {
          this.projects.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.closeModal();
        }
      });
    } else {
      this.projetService.createProject(formData as CreateProjectDto).subscribe({
        next: (created) => {
          this.projects.update(list => [created, ...list]);
          this.closeModal();
        }
      });
    }
  }

  onDeleteProject(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce projet ? Toutes ses tâches seront aussi supprimées.')) {
      this.projetService.deleteProject(id).subscribe({
        next: () => {
          this.projects.update(list => list.filter(p => p.id !== id));
        }
      });
    }
  }
}
