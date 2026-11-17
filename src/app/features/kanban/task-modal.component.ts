import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task, TaskStatus, TaskPriority, CreateTaskDto } from '../../core/models/task.model';
import { Project } from '../../core/models/projet.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Éditer la Tâche' : 'Créer une Nouvelle Tâche' }}</h2>
          <button class="btn-close" (click)="close()">✕</button>
        </div>

        <form [formGroup]="taskForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="title">Titre de la tâche *</label>
            <input id="title" type="text" formControlName="title" placeholder="ex: Configurer la base de données" />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" rows="3" formControlName="description" placeholder="Détails complémentaires..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="status">Statut *</label>
              <select id="status" formControlName="status">
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="en_attente">En attente</option>
                <option value="termine">Terminé</option>
              </select>
            </div>

            <div class="form-group">
              <label for="priority">Priorité *</label>
              <select id="priority" formControlName="priority">
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="critical">Critique ⚡</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="project_id">Projet *</label>
              <select id="project_id" formControlName="project_id">
                <option [ngValue]="null" disabled>Sélectionnez un projet</option>
                @for (p of projects; track p.id) {
                  <option [ngValue]="p.id">{{ p.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label for="assigned_id">Développeur assigné</label>
              <select id="assigned_id" formControlName="assigned_id">
                <option [ngValue]="null">Non assigné</option>
                @for (u of assignableUsers; track u.id) {
                  <option [ngValue]="u.id">{{ u.name }} ({{ u.role }})</option>
                }
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="due_date">Date d'échéance</label>
            <input id="due_date" type="date" formControlName="due_date" />
          </div>

          @if (serverError) {
            <div class="form-error" role="alert">⚠️ {{ serverError }}</div>
          }

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="close()">Annuler</button>
            <button type="submit" class="btn-submit" [disabled]="taskForm.invalid || isSubmitting">
              {{ isSubmitting ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer la Tâche') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.8);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      width: 100%;
      max-width: 540px;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    h2 {
      color: #f8fafc;
      font-size: 1.35rem;
      font-weight: 700;
      margin: 0;
    }

    .btn-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
    }

    .form-group {
      margin-bottom: 1.15rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    label {
      display: block;
      color: #cbd5e1;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.4rem;
    }

    input, textarea, select {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: #fff;
      font-size: 0.9rem;
      outline: none;
      box-sizing: border-box;
    }

    input:focus, textarea:focus, select:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    option {
      background: #0f172a;
      color: #fff;
    }

    .form-error {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      padding: 0.65rem 0.9rem;
      border-radius: 10px;
      font-size: 0.85rem;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.75rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      padding: 0.65rem 1.25rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-submit {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      color: #fff;
      padding: 0.65rem 1.4rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class TaskModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() task: Task | null = null;
  @Input() projects: Project[] = [];
  @Input() users: User[] = [];
  @Input() defaultProjectId: number | null = null;
  @Input() isSubmitting = false;
  @Input() serverError: string | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<CreateTaskDto>();

  taskForm: FormGroup;

  constructor(private fb: FormBuilder, private destroyRef: DestroyRef) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['a_faire', Validators.required],
      priority: ['medium', Validators.required],
      project_id: [null, Validators.required],
      assigned_id: [null],
      due_date: ['']
    });

    // Quand le projet change, on retire l'assigné s'il n'en est pas membre
    this.taskForm.get('project_id')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const assignedId = this.taskForm.get('assigned_id')!.value;
        if (assignedId !== null && !this.assignableUsers.some(u => u.id === assignedId)) {
          this.taskForm.patchValue({ assigned_id: null }, { emitEvent: false });
        }
      });
  }

  get isEditMode(): boolean {
    return !!this.task;
  }

  /**
   * Utilisateurs assignables : les membres du projet sélectionné
   * (à défaut, tous les développeurs chargés)
   */
  get assignableUsers(): User[] {
    const projectId = this.taskForm.get('project_id')?.value;
    const project = this.projects.find(p => p.id === projectId);
    const members = project?.users ?? this.users;

    // En édition, on garde l'assigné actuel même s'il n'est plus membre du projet
    const current = this.task?.assigned_user;
    const sameProject = projectId === (this.task?.project_id ?? this.task?.project?.id);
    if (current && sameProject && !members.some(u => u.id === current.id)) {
      return [...members, current];
    }
    return members;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Réinitialise le formulaire à chaque ouverture, pas seulement quand la tâche change
    if ((changes['isOpen'] || changes['task']) && this.isOpen) {
      this.initForm();
    }
  }

  private initForm(): void {
    const t = this.task;
    this.taskForm.reset({
      title: t?.title ?? '',
      description: t?.description ?? '',
      status: t?.status ?? 'a_faire',
      priority: t?.priority ?? 'medium',
      project_id: t
        ? (t.project_id ?? t.project?.id ?? null)
        : (this.defaultProjectId ?? this.projects[0]?.id ?? null),
      assigned_id: t ? (t.assigned_id ?? t.assigned_user?.id ?? null) : null,
      due_date: t?.due_date ?? ''
    });
  }

  close(): void {
    this.onClose.emit();
  }

  onSubmit(): void {
    if (this.taskForm.invalid || this.isSubmitting) return;
    this.onSave.emit(this.taskForm.getRawValue());
  }
}
