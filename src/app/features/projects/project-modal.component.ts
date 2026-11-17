import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project, ProjectStatus } from '../../core/models/projet.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-project-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ isEditMode ? 'Éditer le Projet' : 'Créer un Nouveau Projet' }}</h2>
          <button class="btn-close" (click)="close()">✕</button>
        </div>

        <form [formGroup]="projectForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="name">Nom du projet *</label>
            <input id="name" type="text" formControlName="name" placeholder="ex: Refonte du site E-commerce" />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" rows="3" formControlName="description" placeholder="Objectifs et périmètre du projet..."></textarea>
          </div>

          <div class="form-group">
            <label for="status">Statut *</label>
            <select id="status" formControlName="status">
              <option value="a_faire">À faire</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
            </select>
          </div>

          <div class="form-group">
            <label>Attribuer aux développeurs (Membres du projet)</label>
            <div class="user-checkbox-list">
              @for (user of users; track user.id) {
                <label class="checkbox-item">
                  <input
                    type="checkbox"
                    [checked]="isUserSelected(user.id)"
                    (change)="toggleUser(user.id)"
                  />
                  <span>{{ user.name }} ({{ user.role }})</span>
                </label>
              }
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="close()">Annuler</button>
            <button type="submit" class="btn-submit" [disabled]="projectForm.invalid || isSubmitting()">
              {{ isSubmitting() ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer le Projet') }}
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
      max-width: 520px;
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

    label {
      display: block;
      color: #cbd5e1;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.4rem;
    }

    input[type="text"], textarea, select {
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

    .user-checkbox-list {
      max-height: 150px;
      overflow-y: auto;
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: #cbd5e1;
      font-size: 0.875rem;
      cursor: pointer;
      margin: 0;
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
      background: linear-gradient(135deg, #a855f7, #6366f1);
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
export class ProjectModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() project: Project | null = null;
  @Input() users: User[] = [];
  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<any>();

  projectForm: FormGroup;
  selectedUserIds = signal<number[]>([]);
  isSubmitting = signal(false);

  constructor(private fb: FormBuilder) {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      status: ['a_faire', Validators.required]
    });
  }

  get isEditMode(): boolean {
    return !!this.project;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project'] && this.project) {
      this.projectForm.patchValue({
        name: this.project.name,
        description: this.project.description || '',
        status: this.project.status
      });
      this.selectedUserIds.set(this.project.users?.map(u => u.id) || []);
    } else if (changes['project'] && !this.project) {
      this.projectForm.reset({
        name: '',
        description: '',
        status: 'a_faire'
      });
      this.selectedUserIds.set([]);
    }
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUserIds().includes(userId);
  }

  toggleUser(userId: number): void {
    if (this.isUserSelected(userId)) {
      this.selectedUserIds.update(ids => ids.filter(id => id !== userId));
    } else {
      this.selectedUserIds.update(ids => [...ids, userId]);
    }
  }

  close(): void {
    this.onClose.emit();
  }

  onSubmit(): void {
    if (this.projectForm.invalid) return;
    const payload = {
      ...this.projectForm.value,
      user_ids: this.selectedUserIds()
    };
    this.onSave.emit(payload);
  }
}
