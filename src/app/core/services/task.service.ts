import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, CreateTaskDto, UpdateTaskDto, TaskStatus, TaskPriority } from '../models/task.model';
import { ApiResponse } from '../models/api-response.model';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  project_id?: number;
  assigned_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir toutes les tâches avec filtres optionnels
   */
  getTasks(filters?: TaskFilters): Observable<Task[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.project_id) params = params.set('project_id', filters.project_id.toString());
      if (filters.assigned_id) params = params.set('assigned_id', filters.assigned_id.toString());
    }

    return this.http.get<ApiResponse<Task[]>>(this.apiUrl, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir une tâche par son ID
   */
  getTask(id: number): Observable<Task> {
    return this.http.get<ApiResponse<Task>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Créer une tâche
   */
  createTask(data: CreateTaskDto): Observable<Task> {
    return this.http.post<ApiResponse<Task>>(this.apiUrl, data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour une tâche
   */
  updateTask(id: number, data: UpdateTaskDto): Observable<Task> {
    return this.http.put<ApiResponse<Task>>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Supprimer une tâche
   */
  deleteTask(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
