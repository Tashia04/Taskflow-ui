import { Component, OnInit, DestroyRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { TaskCardComponent } from './task-card.component';
import { TaskModalComponent } from './task-modal.component';
import { TaskService } from '../../core/services/task.service';
import { ProjetService } from '../../core/services/projet.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Task, TaskStatus, TaskPriority, CreateTaskDto } from '../../core/models/task.model';
import { Project } from '../../core/models/projet.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CdkDropListGroup, CdkDropList, CdkDrag,
    NavbarComponent, TaskCardComponent, TaskModalComponent
  ],
  template: `
    <app-navbar></app-navbar>

    <main class="kanban-container">
      <!-- Top Control Header -->
      <header class="board-header">
        <div class="header-left">
          <h1>Tableau Kanban</h1>
          <p class="subtitle">Gérez et suivez le progrès de vos tâches en temps réel</p>
        </div>

        <div class="header-right">
          @if (canCreateTask) {
            <button class="btn-primary" (click)="openCreateModal()">
              <span>➕</span> Nouvelle Tâche
            </button>
          }
        </div>
      </header>

      <!-- Filter & Search Bar -->
      <div class="filter-bar">
        <div class="search-box">
          <span class="icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher une tâche..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
        </div>

        <div class="filters">
          <select [ngModel]="selectedProjectId()" (ngModelChange)="onProjectFilterChange($event)">
            <option [ngValue]="null">Tous les projets</option>
            @for (p of projects(); track p.id) {
              <option [ngValue]="p.id">{{ p.name }}</option>
            }
          </select>

          <select [ngModel]="selectedPriority()" (ngModelChange)="selectedPriority.set($event)">
            <option value="">Toutes les priorités</option>
            <option value="critical">Critique ⚡</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Faible</option>
          </select>
        </div>
      </div>

      @if (errorMessage()) {
        <div class="alert-error" role="alert">
          <span>⚠️ {{ errorMessage() }}</span>
          <button type="button" class="alert-close" (click)="errorMessage.set(null)" title="Fermer">✕</button>
        </div>
      }

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Chargement des tâches...</p>
        </div>
      } @else {
        <!-- Kanban Columns Board -->
        <!-- cdkDropListGroup : toutes les colonnes sont reliées entre elles -->
        <div class="board-grid" cdkDropListGroup>
          @for (column of columns; track column.status) {
            <div class="kanban-column">
              <div class="column-header">
                <div class="title-group">
                  <span class="status-dot" [ngClass]="column.dotClass"></span>
                  <h2>{{ column.label }}</h2>
                </div>
                <span class="count-badge">{{ tasksByStatus()[column.status].length }}</span>
              </div>
              <div
                class="column-content"
                cdkDropList
                cdkDropListSortingDisabled
                [cdkDropListData]="column.status"
                (cdkDropListDropped)="onDrop($event)"
              >
                @for (task of tasksByStatus()[column.status]; track task.id) {
                  <app-task-card
                    cdkDrag
                    [cdkDragData]="task"
                    [cdkDragDisabled]="!canMoveTask(task)"
                    [cdkDragStartDelay]="{ touch: 200, mouse: 0 }"
                    [class.draggable]="canMoveTask(task)"
                    [task]="task"
                    [canMove]="canMoveTask(task)"
                    (onStatusChange)="onStatusChange($event)"
                    (onEdit)="openEditModal($event)"
                    (onDelete)="onDeleteTask($event)"
                  ></app-task-card>
                } @empty {
                  <div class="empty-state">{{ column.emptyLabel }}</div>
                }
              </div>
            </div>
          }
        </div>
      }
    </main>

    <!-- Task Modal -->
    <app-task-modal
      [isOpen]="isModalOpen()"
      [task]="editingTask()"
      [projects]="creatableProjects()"
      [users]="users()"
      [defaultProjectId]="selectedProjectId()"
      [isSubmitting]="isSubmitting()"
      [serverError]="modalError()"
      (onClose)="closeModal()"
      (onSave)="onSaveTask($event)"
    ></app-task-modal>
  `,
  styles: [`
    .kanban-container {
      max-width: 1500px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
    }

    .board-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
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
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
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
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px -3px rgba(99, 102, 241, 0.4);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px -5px rgba(99, 102, 241, 0.5);
    }

    .filter-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.85rem 1.25rem;
      border-radius: 16px;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;
      display: flex;
      align-items: center;
    }

    .search-box .icon {
      position: absolute;
      left: 0.85rem;
      font-size: 0.9rem;
    }

    .search-box input {
      width: 100%;
      padding: 0.6rem 1rem 0.6rem 2.5rem;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #fff;
      font-size: 0.875rem;
      outline: none;
    }

    .filters {
      display: flex;
      gap: 0.75rem;
    }

    .filters select {
      padding: 0.6rem 1rem;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #cbd5e1;
      font-size: 0.875rem;
      outline: none;
    }

    .alert-error {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }

    .alert-close {
      background: transparent;
      border: none;
      color: #fca5a5;
      cursor: pointer;
      font-size: 1rem;
    }

    .board-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      align-items: start;
    }

    @media (max-width: 1200px) {
      .board-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .board-grid {
        grid-template-columns: 1fr;
      }
    }

    .kanban-column {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 1.25rem;
      min-height: 500px;
    }

    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .column-header h2 {
      color: #f8fafc;
      font-size: 0.875rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.05em;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .dot-todo { background: #94a3b8; box-shadow: 0 0 8px #94a3b8; }
    .dot-inprogress { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; }
    .dot-pending { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
    .dot-done { background: #10b981; box-shadow: 0 0 8px #10b981; }

    .count-badge {
      background: rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
    }

    .column-content {
      min-height: 400px;
      border-radius: 14px;
      transition: background 0.2s ease, outline-color 0.2s ease;
      outline: 2px dashed transparent;
      outline-offset: 4px;
    }

    /* Colonne survolée pendant un glisser-déposer */
    .column-content.cdk-drop-list-dragging {
      background: rgba(99, 102, 241, 0.08);
      outline-color: rgba(99, 102, 241, 0.45);
    }

    app-task-card {
      display: block;
    }

    app-task-card.draggable {
      cursor: grab;
    }

    /* Carte qui suit la souris */
    .cdk-drag-preview {
      cursor: grabbing;
      transform: rotate(2deg);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6);
      border-radius: 16px;
      opacity: 0.95;
    }

    /* Emplacement d'origine pendant le déplacement */
    .cdk-drag-placeholder {
      opacity: 0.3;
    }

    .cdk-drag-animating {
      transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #64748b;
      font-size: 0.85rem;
      border: 2px dashed rgba(255, 255, 255, 0.05);
      border-radius: 14px;
    }

    .loading-container {
      text-align: center;
      padding: 5rem 1rem;
      color: #94a3b8;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(99, 102, 241, 0.2);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class KanbanBoardComponent implements OnInit {
  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  users = signal<User[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  // Filters (des signals, pour que filteredTasks se recalcule à chaque changement)
  searchQuery = signal('');
  selectedProjectId = signal<number | null>(null);
  selectedPriority = signal<TaskPriority | ''>('');

  // Modal
  isModalOpen = signal(false);
  editingTask = signal<Task | null>(null);
  isSubmitting = signal(false);
  modalError = signal<string | null>(null);

  // Filtered Tasks
  filteredTasks = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const projectId = this.selectedProjectId();
    const priority = this.selectedPriority();

    return this.tasks().filter(t => {
      const matchSearch = !query || t.title.toLowerCase().includes(query);
      const matchProject = projectId === null || t.project_id === projectId || t.project?.id === projectId;
      const matchPriority = !priority || t.priority === priority;
      return matchSearch && matchProject && matchPriority;
    });
  });

  // Projets où l'utilisateur peut créer des tâches (même règle que TaskPolicy::create)
  creatableProjects = computed(() => {
    if (this.authService.isAdmin()) return this.projects();
    const userId = this.authService.currentUser()?.id;
    return this.projects().filter(p => (p.owner_id ?? p.owner?.id) === userId);
  });

  // Colonnes du tableau, dans l'ordre d'affichage
  readonly columns: { status: TaskStatus; label: string; dotClass: string; emptyLabel: string }[] = [
    { status: 'a_faire', label: 'À FAIRE', dotClass: 'dot-todo', emptyLabel: 'Aucune tâche à faire' },
    { status: 'en_cours', label: 'EN COURS', dotClass: 'dot-inprogress', emptyLabel: 'Aucune tâche en cours' },
    { status: 'en_attente', label: 'EN ATTENTE', dotClass: 'dot-pending', emptyLabel: 'Aucune tâche en attente' },
    { status: 'termine', label: 'TERMINÉ', dotClass: 'dot-done', emptyLabel: 'Aucune tâche terminée' }
  ];

  tasksByStatus = computed(() => {
    const groups: Record<TaskStatus, Task[]> = { a_faire: [], en_cours: [], en_attente: [], termine: [] };
    this.filteredTasks().forEach(t => groups[t.status]?.push(t));
    return groups;
  });

  constructor(
    private taskService: TaskService,
    private projetService: ProjetService,
    private userService: UserService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    // Le filtre projet est piloté par l'URL (?project_id=), ex: depuis "Voir les tâches"
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const id = Number(params.get('project_id'));
        this.selectedProjectId.set(id > 0 ? id : null);
      });

    this.loadData();
  }

  get canCreateTask(): boolean {
    return this.authService.isAdmin() || this.authService.isManager();
  }

  onProjectFilterChange(projectId: number | null): void {
    // null retire le paramètre de l'URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { project_id: projectId },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  loadData(): void {
    this.isLoading.set(true);
    this.projetService.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
      },
      error: (err) => this.errorMessage.set(this.getErrorMessage(err, 'Impossible de charger les projets.'))
    });

    this.loadUsers();
    this.loadTasks();
  }

  loadUsers(): void {
    // On charge uniquement les développeurs pour l'assignation de tâches
    this.userService.getUsers('developer').subscribe({
      next: (users) => {
        this.users.set(users);
      },
      error: () => {
        // En cas d'erreur de chargement global, fallback sur la méthode locale
        this.extractUsersFromProjects(this.projects());
      }
    });
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.getErrorMessage(err, 'Impossible de charger les tâches.'));
      }
    });
  }

  private extractUsersFromProjects(projects: Project[]): void {
    const userMap = new Map<number, User>();
    projects.forEach(p => {
      if (p.owner) userMap.set(p.owner.id, p.owner);
      p.users?.forEach(u => userMap.set(u.id, u));
    });
    this.users.set(Array.from(userMap.values()));
  }

  /**
   * Admin et manager peuvent déplacer toutes les tâches,
   * un développeur uniquement celles qui lui sont assignées (même règle que TaskPolicy::update)
   */
  canMoveTask(task: Task): boolean {
    if (this.authService.isAdmin() || this.authService.isManager()) return true;
    const userId = this.authService.currentUser()?.id;
    return !!userId && (task.assigned_id ?? task.assigned_user?.id) === userId;
  }

  onDrop(event: CdkDragDrop<TaskStatus, TaskStatus, Task>): void {
    // Pas de position en base : un déplacement dans la même colonne ne change rien
    if (event.previousContainer === event.container) return;
    this.onStatusChange({ id: event.item.data.id, status: event.container.data });
  }

  onStatusChange(event: { id: number; status: TaskStatus }): void {
    const previous = this.tasks().find(t => t.id === event.id);
    if (!previous || previous.status === event.status) return;

    // Mise à jour optimiste : la carte change de colonne tout de suite
    this.tasks.update(list => list.map(t => t.id === event.id ? { ...t, status: event.status } : t));

    this.taskService.updateTask(event.id, { status: event.status }).subscribe({
      next: (updatedTask) => {
        this.tasks.update(list => list.map(t => t.id === updatedTask.id ? updatedTask : t));
      },
      error: (err) => {
        // Retour à la colonne d'origine si l'API refuse
        this.tasks.update(list => list.map(t => t.id === previous.id ? previous : t));
        this.errorMessage.set(this.getErrorMessage(err, 'Impossible de changer le statut de la tâche.'));
      }
    });
  }

  openCreateModal(): void {
    this.editingTask.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(task: Task): void {
    this.editingTask.set(task);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingTask.set(null);
    this.modalError.set(null);
  }

  onSaveTask(formData: CreateTaskDto): void {
    if (this.isSubmitting()) return;

    const task = this.editingTask();
    const request$ = task
      ? this.taskService.updateTask(task.id, formData)
      : this.taskService.createTask(formData);

    this.isSubmitting.set(true);
    this.modalError.set(null);

    request$.subscribe({
      next: (saved) => {
        this.tasks.update(list => task ? list.map(t => t.id === saved.id ? saved : t) : [saved, ...list]);
        this.isSubmitting.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.modalError.set(this.getErrorMessage(err, 'Impossible d\'enregistrer la tâche.'));
      }
    });
  }

  onDeleteTask(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          this.tasks.update(list => list.filter(t => t.id !== id));
        },
        error: (err) => this.errorMessage.set(this.getErrorMessage(err, 'Impossible de supprimer la tâche.'))
      });
    }
  }

  /**
   * Transforme une erreur HTTP en message lisible (403, erreurs de validation Laravel 422, etc.)
   */
  private getErrorMessage(err: HttpErrorResponse, fallback: string): string {
    if (err.status === 403) {
      return 'Vous n\'avez pas les droits pour effectuer cette action.';
    }
    const errors = err.error?.errors as Record<string, string[]> | undefined;
    if (errors) {
      return Object.values(errors).flat().join(' ');
    }
    return err.error?.message || fallback;
  }
}
