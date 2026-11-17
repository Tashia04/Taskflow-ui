import { Project } from './projet.model';
import { User } from './user.model';

export type TaskStatus = 'a_faire' | 'en_cours' | 'en_attente' | 'termine';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  project_id?: number;
  project?: Project;
  assigned_id?: number;
  assigned_user?: User;
  created_at?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: number;
  assigned_id?: number;
  due_date?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  project_id?: number;
  assigned_id?: number;
  due_date?: string;
}
