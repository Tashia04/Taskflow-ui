import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, CreateProjectDto, UpdateProjectDto } from '../models/projet.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ProjetService {
  private apiUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir tous les projets avec filtres optionnels
   */
  getProjects(filters?: { name?: string }): Observable<Project[]> {
    let params = new HttpParams();
    if (filters?.name) {
      params = params.set('name', filters.name);
    }

    return this.http.get<ApiResponse<Project[]>>(this.apiUrl, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir un projet par son ID
   */
  getProject(id: number): Observable<Project> {
    return this.http.get<ApiResponse<Project>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Créer un nouveau projet
   */
  createProject(data: CreateProjectDto): Observable<Project> {
    return this.http.post<ApiResponse<Project>>(this.apiUrl, data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour un projet
   */
  updateProject(id: number, data: UpdateProjectDto): Observable<Project> {
    return this.http.put<ApiResponse<Project>>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => response.data)
    );
  }

  /**
   * Supprimer un projet
   */
  deleteProject(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
