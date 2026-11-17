import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task, TaskStatus } from '../../core/models/task.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="task-card" [ngClass]="'priority-' + task.priority">
      <div class="card-header">
        <span class="project-tag" *ngIf="task.project">
          📁 {{ task.project.name }}
        </span>
        <span class="priority-pill" [ngClass]="'priority-' + task.priority">
          {{ priorityLabel }}
        </span>
      </div>

      <h3 class="task-title">{{ task.title }}</h3>
      <p class="task-desc" *ngIf="task.description">{{ task.description }}</p>

      <div class="card-footer">
        <div class="meta-left">
          <span class="due-date" *ngIf="task.due_date" [class.overdue]="isOverdue">
            📅 {{ task.due_date }}
          </span>
        </div>

        <div class="meta-right">
          <div class="user-avatar" *ngIf="task.assigned_user" [title]="'Assigné à: ' + task.assigned_user.name">
            {{ task.assigned_user.name.charAt(0).toUpperCase() }}
          </div>
        </div>
      </div>

      <!-- Actions bar -->
      <div class="card-actions">
        <div class="status-quick-move">
          <button
            *ngIf="canMoveBack"
            class="btn-icon"
            (click)="onMoveStatus(prevStatus!)"
            title="Déplacer vers la gauche"
          >
            ◀
          </button>
          <button
            *ngIf="canMoveNext"
            class="btn-icon"
            (click)="onMoveStatus(nextStatus!)"
            title="Déplacer vers la droite"
          >
            ▶
          </button>
        </div>

        <div class="crud-actions">
          <button *ngIf="canEdit" class="btn-icon btn-edit" (click)="onEdit.emit(task)" title="Éditer">✏️</button>
          <button *ngIf="canDelete" class="btn-icon btn-delete" (click)="onDelete.emit(task.id)" title="Supprimer">🗑️</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .task-card {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.1rem;
      margin-bottom: 1rem;
      transition: all 0.25s ease;
      position: relative;
    }

    .task-card:hover {
      transform: translateY(-3px);
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.4);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .project-tag {
      font-size: 0.725rem;
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.15rem 0.5rem;
      border-radius: 6px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .priority-pill {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.15rem 0.5rem;
      border-radius: 20px;
      letter-spacing: 0.03em;
    }

    .priority-pill.priority-critical {
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.4);
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
    }

    .priority-pill.priority-high {
      background: rgba(249, 115, 22, 0.2);
      color: #fdba74;
      border: 1px solid rgba(249, 115, 22, 0.4);
    }

    .priority-pill.priority-medium {
      background: rgba(59, 130, 246, 0.2);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.4);
    }

    .priority-pill.priority-low {
      background: rgba(148, 163, 184, 0.2);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }

    .task-title {
      color: #f8fafc;
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      line-height: 1.35;
    }

    .task-desc {
      color: #94a3b8;
      font-size: 0.825rem;
      margin: 0 0 1rem 0;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .due-date {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .due-date.overdue {
      color: #f87171;
      font-weight: 600;
    }

    .user-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, #a855f7, #6366f1);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.75rem;
    }

    .status-quick-move, .crud-actions {
      display: flex;
      gap: 0.35rem;
    }

    .btn-icon {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border-radius: 8px;
      padding: 0.25rem 0.45rem;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      background: rgba(99, 102, 241, 0.3);
      color: #fff;
    }

    .btn-delete:hover {
      background: rgba(239, 68, 68, 0.3);
    }
  `]
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input() canMove = true;
  @Output() onStatusChange = new EventEmitter<{ id: number; status: TaskStatus }>();
  @Output() onEdit = new EventEmitter<Task>();
  @Output() onDelete = new EventEmitter<number>();

  constructor(private authService: AuthService) {}

  get priorityLabel(): string {
    const map: Record<string, string> = {
      critical: 'Critique',
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Faible'
    };
    return map[this.task.priority] || this.task.priority;
  }

  get isOverdue(): boolean {
    if (!this.task.due_date || this.task.status === 'termine') return false;
    // Comparaison de dates locales "YYYY-MM-DD" : une tâche due aujourd'hui n'est pas en retard
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return this.task.due_date < today;
  }

  get canEdit(): boolean {
    return this.authService.isAdmin() || this.authService.isManager();
  }

  get canDelete(): boolean {
    return this.authService.isAdmin() || this.authService.isManager();
  }

  private statusOrder: TaskStatus[] = ['a_faire', 'en_cours', 'en_attente', 'termine'];

  get prevStatus(): TaskStatus | null {
    const idx = this.statusOrder.indexOf(this.task.status);
    return idx > 0 ? this.statusOrder[idx - 1] : null;
  }

  get nextStatus(): TaskStatus | null {
    const idx = this.statusOrder.indexOf(this.task.status);
    return idx < this.statusOrder.length - 1 ? this.statusOrder[idx + 1] : null;
  }

  get canMoveBack(): boolean {
    return this.canMove && this.prevStatus !== null;
  }

  get canMoveNext(): boolean {
    return this.canMove && this.nextStatus !== null;
  }

  onMoveStatus(newStatus: TaskStatus): void {
    this.onStatusChange.emit({ id: this.task.id, status: newStatus });
  }
}
